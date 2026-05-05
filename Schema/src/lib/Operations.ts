import {Validator, ValidatorClass} from '../Validator';
import {UnknownValidator, NeverValidator, UnionValidator, IntersectValidator} from "../validators";
import {DomainError, MergeError} from "./errors";

export type UnaryValidatorOperation = (validator: Validator, registry: Operations) => Validator;
export type BinaryValidatorOperation = (a: Validator, b: Validator, registry: Operations) => Validator;
export type BinaryBooleanOperation = (a: Validator, b: Validator, registry: Operations) => boolean;

export interface ReadonlyOperationsRegistry {
	normalize: ReadonlyMap<ValidatorClass, UnaryValidatorOperation>;
	merge: ReadonlyMap<ValidatorClass, ReadonlyMap<ValidatorClass, BinaryValidatorOperation>>;
	isEqual: ReadonlyMap<ValidatorClass, ReadonlyMap<ValidatorClass, BinaryBooleanOperation>>;
	isSubset: ReadonlyMap<ValidatorClass, ReadonlyMap<ValidatorClass, BinaryBooleanOperation>>;
}

export class Operations {
	public static merge(operations: readonly Operations[]): Operations {
		if (operations.length < 1)
			return new Operations();

		if (operations.length === 1)
			return operations[0]!;

		const operationsRegistry = operations.reduce((result, operation) => {
			const registry = operation.registry;

			if (registry.normalize) {
				result.normalize = this._mergeMaps(result.normalize, registry.normalize, (validator) => {
					throw new DomainError(`Duplicate Normalization Operation`, {
						cause: {validator: validator.name}
					});
				});
			}

			if (registry.merge) {
				result.merge = this._mergeMatrices(result.merge, registry.merge, (matrix, duplicate) => {
					throw new DomainError(`Duplicate merge Operation`, {
						cause: {matrix: matrix.name, duplicate: duplicate.name}
					});
				}) as Map<ValidatorClass, Map<ValidatorClass, BinaryValidatorOperation>>;
			}

			if (registry.isEqual) {
				result.isEqual = this._mergeMatrices(result.isEqual, registry.isEqual, (matrix, duplicate) => {
					throw new DomainError(`Duplicate isEqual Operation`, {
						cause: {matrix: matrix.name, duplicate: duplicate.name}
					});
				}) as Map<ValidatorClass, Map<ValidatorClass, BinaryBooleanOperation>>;
			}

			if (registry.isSubset) {
				result.isSubset = this._mergeMatrices(result.isSubset, registry.isSubset, (matrix, duplicate) => {
					throw new DomainError(`Duplicate isSubset Operation`, {
						cause: {matrix: matrix.name, duplicate: duplicate.name}
					});
				}) as Map<ValidatorClass, Map<ValidatorClass, BinaryBooleanOperation>>;
			}

			return result;
		}, {
			normalize: new Map(),
			merge: new Map(),
			isEqual: new Map(),
			isSubset: new Map()
		});

		return new Operations(operationsRegistry);
	}

	private static _cloneMap<K, V>(map: ReadonlyMap<K, V>): Map<K, V> {
		return new Map([...map.entries()]);
	}

	private static _cloneMatrix<K1, K2, V>(matrix: ReadonlyMap<K1, ReadonlyMap<K2, V>>): Map<K1, Map<K2, V>> {
		return new Map([
			...matrix.entries().map(([validator, operationsMap]) => {
				return [validator, this._cloneMap(operationsMap)] as const;
			})
		]);
	}

	private static _mergeMaps<K, V>(
		a: ReadonlyMap<K, V>,
		b: ReadonlyMap<K, V>,
		duplicateCallback: (duplicate: K) => unknown = (duplicate) => {throw duplicate}
	): Map<K, V> {
		const result = this._cloneMap(a);

		for (const [key, value] of b) {
			if (result.has(key))
				duplicateCallback(key);

			result.set(key, value);
		}

		return result;
	}

	private static _mergeMatrices<K1, K2, V>(
		a: ReadonlyMap<K1, ReadonlyMap<K2, V>>,
		b: ReadonlyMap<K1, ReadonlyMap<K2, V>>,
		duplicateCallback: (matrix: K1, duplicate: K2) => unknown = (matrix, duplicate) => {throw {matrix, duplicate}}
	): ReadonlyMap<K1, ReadonlyMap<K2, V>> {
		const resultMatrix = this._cloneMatrix(a);

		for (const [key1, map] of b) {
			const resultMap = resultMatrix.get(key1) ?? new Map<K2, V>();

			for (const [key2, operation] of map) {
				if (resultMap.has(key2))
					duplicateCallback(key1, key2);

				resultMap.set(key2, operation);
			}

			resultMatrix.set(key1, resultMap);
		}

		return resultMatrix;
	}

	public constructor(
		public readonly registry: ReadonlyOperationsRegistry = {
			normalize: new Map(),
			merge: new Map(),
			isEqual: new Map(),
			isSubset: new Map()
		}
	) {}

	private _lookupNormalizeOperation(key: ValidatorClass): UnaryValidatorOperation | undefined {
		return this.registry.normalize.get(key);
	}

	private _lookupMergeOperation(key1: ValidatorClass, key2: ValidatorClass): BinaryValidatorOperation | undefined {
		return this.registry.merge.get(key1)?.get(key2);
	}

	private _lookupIsEqualOperation(key1: ValidatorClass, key2: ValidatorClass): BinaryBooleanOperation | undefined {
		return this.registry.isEqual.get(key1)?.get(key2);
	}

	private _lookupIsSubsetOperation(key1: ValidatorClass, key2: ValidatorClass): BinaryBooleanOperation | undefined {
		return this.registry.isSubset.get(key1)?.get(key2);
	}

	public normalize(validator: Validator): Validator {
		if (validator instanceof UnknownValidator)
			return validator;

		if (validator instanceof NeverValidator)
			return validator;

		if (validator instanceof UnionValidator)
			return this._normalizeUnion(validator);

		if (validator instanceof IntersectValidator)
			return this._normalizeIntersect(validator);

		const operation = this._lookupNormalizeOperation(validator.constructor as ValidatorClass)

		if (!operation)
			return validator;

		return operation(validator, this);
	}

	public merge(a: Validator, b: Validator): Validator {
		return this.normalize(
			this._merge(this.normalize(a), this.normalize(b))
		);
	}

	public isEqual(a: Validator, b: Validator): boolean {
		return this._isEqual(this.normalize(a), this.normalize(b));
	}

	public isSubset(a: Validator, b: Validator): boolean {
		return this._isSubset(this.normalize(a), this.normalize(b));
	}

	private _normalizeUnion(union: UnionValidator): Validator {
		// Flatten, normalize and filter out NeverValidator ((A | never) | B => A | never | B => A | B)
		const validators = this._flattenUnion(union)
			.map(validator => this.normalize(validator))
			.filter(validator => !(validator instanceof NeverValidator));

		// If any Validator is an UnknownValidator, just return an UnknownValidator (A | unknown => unknown)
		if (validators.some(validator => validator instanceof UnknownValidator))
			return new UnknownValidator();

		// Deduplicate Validators (A | B | A => A | B)
		const deduplicated = this._deduplicateValidators(validators);

		// Remove narrower Validators (if isSubset(A, B) then A | B => B)
		const reduced = deduplicated.filter((validator, index) => {
			return !deduplicated.some((other, otherIndex) => {
				if (index === otherIndex)
					return false;

				return this._isSubset(validator, other);
			});
		});

		// If there are no Validators left, return a NeverValidator ( => never)
		if (reduced.length === 0)
			return new NeverValidator();

		// If there is only one Validator left, return it directly
		if (reduced.length === 1)
			return reduced[0]!;

		return new UnionValidator({variants: reduced});
	}

	private _normalizeIntersect(intersect: IntersectValidator): Validator {
		// Flatten the Validators of any nested Intersect first and normalize them
		const flattenedValidators = this._flattenIntersect(intersect)
			.map(validator => this.normalize(validator));

		// If any of the Validators is a NeverValidator, just return a NeverValidator (A & never => never)
		if (flattenedValidators.some(validator => validator instanceof NeverValidator))
			return new NeverValidator();

		// Filter out any UnknownValidators (A & unknown & B => A & B)
		const withoutUnknown = flattenedValidators.filter(
			validator => !(validator instanceof UnknownValidator)
		);

		// Deduplicate Validators (A & B & A => A & B)
		const deduplicated = this._deduplicateValidators(withoutUnknown);

		// If there are no Validators left, return an UnknownValidator ( => unknown)
		if (deduplicated.length === 0)
			return new UnknownValidator();

		// If there is only one Validator left, return it directly (A => A)
		if (deduplicated.length === 1)
			return deduplicated[0]!;

		// Merge all Validators that are left
		let current = deduplicated[0]!;

		for (let i = 1; i < deduplicated.length; i++) {
			const next = deduplicated[i]!;

			try {
				current = this.merge(current, next);
			} catch (error) {
				if (!(error instanceof MergeError))
					throw error;

				return new IntersectValidator({variants: deduplicated});
			}

			current = this.normalize(current);

			if (current instanceof NeverValidator)
				return current;
		}

		return current;
	}

	private _flattenUnion(union: UnionValidator): Validator[] {
		const validators: Validator[] = [];

		for (const validator of union.rules.variants) {
			if (validator instanceof UnionValidator) {
				validators.push(...this._flattenUnion(validator));
			}
			else {
				validators.push(validator);
			}
		}

		return validators;
	}

	private _flattenIntersect(intersect: IntersectValidator): Validator[] {
		const validators: Validator[] = [];

		for (const validator of intersect.rules.variants) {
			if (validator instanceof IntersectValidator) {
				validators.push(...this._flattenIntersect(validator));
			}
			else {
				validators.push(validator);
			}
		}

		return validators;
	}

	private _deduplicateValidators(validators: Validator[]): Validator[] {
		const result: Validator[] = [];

		for (const validator of validators) {
			if (!result.some(existing => this._isEqual(existing, validator)))
				result.push(validator);
		}

		return result;
	}

	private _isEqual(a: Validator, b: Validator): boolean {
		if (a === b)
			return true;

		if (a instanceof UnknownValidator && b instanceof UnknownValidator)
			return true;

		if (a instanceof NeverValidator && b instanceof NeverValidator)
			return true;

		if (a instanceof UnionValidator && b instanceof UnionValidator)
			return this._isEqualValidatorSet(a.rules.variants, b.rules.variants);

		if (a instanceof IntersectValidator && b instanceof IntersectValidator)
			return this._isEqualValidatorSet(a.rules.variants, b.rules.variants);

		const operation = this._lookupIsEqualOperation(
			a.constructor as ValidatorClass,
			b.constructor as ValidatorClass
		);

		if (!operation)
			return false;

		return operation(a, b, this);
	}

	private _isEqualValidatorSet(a: readonly Validator[], b: readonly Validator[]): boolean {
		if (a.length !== b.length)
			return false;

		const matched = new Set<number>();

		for (const left of a) {
			const index = b.findIndex((right, rightIndex) =>
				!matched.has(rightIndex) && this._isEqual(left, right)
			);

			if (index === -1)
				return false;

			matched.add(index);
		}

		return true;
	}

	private _merge(a: Validator, b: Validator): Validator {
		if (this._isEqual(a, b))
			return a.clone();

		if (a instanceof NeverValidator || b instanceof NeverValidator)
			return new NeverValidator();

		if (a instanceof UnknownValidator)
			return b.clone();

		if (b instanceof UnknownValidator)
			return a.clone();

		if (a instanceof UnionValidator) {
			return new UnionValidator(
				{variants: a.rules.variants.map(validator => this.merge(validator, b))}
			);
		}

		if (b instanceof UnionValidator) {
			return new UnionValidator(
				{variants: b.rules.variants.map(validator => this.merge(a, validator))}
			);
		}

		if (a instanceof IntersectValidator) {
			return new IntersectValidator({
				variants: [...a.rules.variants, b]
			});
		}

		if (b instanceof IntersectValidator) {
			return new IntersectValidator({
				variants: [a, ...b.rules.variants]
			});
		}

		const operation = this._lookupMergeOperation(a.constructor as ValidatorClass, b.constructor as ValidatorClass);

		if (!operation)
			throw new MergeError(`No Merge Operation registered`);

		return operation(a, b, this);
	}

	private _isSubset(a: Validator, b: Validator): boolean {
		if (this._isEqual(a, b))
			return true;

		if (a instanceof NeverValidator)
			return true;

		if (b instanceof NeverValidator)
			return false;

		if (b instanceof UnknownValidator)
			return true;

		if (a instanceof UnknownValidator)
			return false;

		if (a instanceof UnionValidator) {
			return a.rules.variants.every(validator =>
				this.isSubset(validator, b)
			);
		}

		if (b instanceof UnionValidator) {
			return b.rules.variants.some(validator =>
				this.isSubset(a, validator)
			);
		}

		if (b instanceof IntersectValidator) {
			return b.rules.variants.every(validator =>
				this.isSubset(a, validator)
			);
		}

		if (a instanceof IntersectValidator) {
			const normalized = this.normalize(a);

			if (!(normalized instanceof IntersectValidator))
				return this.isSubset(normalized, b);

			// Generic proof is not possible here.
			// Example: A & B may be narrower than either A or B alone.
			// Note that this should practically never happen, as Intersects are normalized away by Operations.isSubset
		}

		const operation = this._lookupIsSubsetOperation(a.constructor as ValidatorClass, b.constructor as ValidatorClass);

		if (!operation)
			return false;

		return operation(a, b, this);
	}
}
