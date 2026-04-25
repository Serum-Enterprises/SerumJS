import {JSON} from '@serum-enterprises/json';
import {Definition, UnknownDefinition, Validator} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
import {InferListDefinitionType, InferValidatorReturnType} from '../lib/types';
import {NeverValidator} from "./Never";

export interface UnionValidatorDefinition<
	VARIANTS extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'union';
	variants: VARIANTS;
}

export class UnionValidator<
	VARIANTS = unknown,
	VARIANTSDEFINITION extends readonly Definition[] = readonly Definition[]
> extends Validator<VARIANTS> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): UnionValidator {
		const validatorInstance = new UnionValidator();

		if (!JSON.isArray(definition['variants']))
			throw new DefinitionError(`Expected an Array`, `${path}.variants`);

		validatorInstance._variants = definition['variants'].map((variant, index) =>
			schemaDomain.fromJSON(variant, `${path}.variants[${index}]`)
		);

		return validatorInstance;
	}

	protected _variants: readonly Validator[] = [];

	public variants<const V extends readonly Validator[]>(
		variants: V
	): UnionValidator<InferValidatorReturnType<V[number]>, InferListDefinitionType<V>> {
		this._variants = variants;

		return this as unknown as UnionValidator<
			InferValidatorReturnType<V[number]>,
			InferListDefinitionType<V>
		>;
	}

	public assert(data: unknown, path: string = 'data'): asserts data is VARIANTS {
		if (this._variants.length === 0)
			throw new AssertError(`Expected at least one Variant`, `${path}.variants`);

		const errors: Error[] = [];

		for (const variant of this._variants) {
			try {
				variant.assert(data, path);
				// If one variant matches, the union is satisfied
				return;
			} catch (e) {
				errors.push(e as Error);
			}
		}

		throw new AssertError(`Expected to match at least one Union Variant`, path, {cause: errors});
	}

	public isSameValidator(other: Validator): other is UnionValidator {
		return this.constructor === other.constructor;
	}

	public clone(): this {
		const validator = new UnionValidator() as this;

		validator._variants = this._variants.map(v => v.clone());

		return validator;
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		let result = true;

		result &&= this._variants.length === other._variants.length;

		for (let index = 0; index < this._variants.length && result; index++) {
			const left = this._variants[index];
			const right = other._variants[index];

			result &&= right !== undefined && left !== undefined && left.isEqual(right);
		}

		return result;
	}

	protected _pushVariant(variants: Validator[], variant: Validator): void {
		if (variant instanceof NeverValidator)
			return;

		if (variant instanceof UnionValidator) {
			for (const child of variant._variants)
				this._pushVariant(variants, child);

			return;
		}

		if (!variants.some(existing => existing.isEqual(variant)))
			variants.push(variant);
	}

	public merge(other: Validator, path: string = 'validator'): Validator {
		const variants: Validator[] = [];

		if (this.isSameValidator(other)) {
			for (const left of this._variants) {
				for (const right of other._variants) {
					try {
						this._pushVariant(
							variants,
							left.merge(right, `${path}.variants`)
								.normalize() as Validator
						);
					} catch {}
				}
			}
		} else {
			for (const variant of this._variants) {
				try {
					this._pushVariant(
						variants,
						variant.merge(other, `${path}.variants`)
							.normalize() as Validator
					);
				} catch {}
			}
		}

		if (variants.length === 0)
			return new NeverValidator();

		if (variants.length === 1)
			return variants[0]!;

		return new UnionValidator().variants(variants);
	}

	public normalize(): Validator {
		const variants: Validator[] = [];

		for (const variant of this._variants) {
			const normalized = variant.normalize() as Validator;

			this._pushVariant(variants, normalized);
		}

		if (variants.length === 0)
			return new NeverValidator();

		if (variants.length === 1)
			return variants[0]!;

		return new UnionValidator().variants(variants);
	}

	protected override _isSubset(other: Validator): boolean {
		// Empty union behaves like Never.
		if (this._variants.length === 0)
			return true;

		return this._variants.every(variant => variant.isSubset(other));
	}


	public toJSON(): UnionValidatorDefinition<VARIANTSDEFINITION> {
		const definition: UnionValidatorDefinition = {
			type: 'union',
			variants: this._variants.map(variant => variant.toJSON())
		};

		return definition as UnionValidatorDefinition<VARIANTSDEFINITION>;
	}
}