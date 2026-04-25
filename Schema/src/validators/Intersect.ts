import {JSON} from '@serum-enterprises/json';
import {Definition, UnknownDefinition, Validator} from '../Validator';
import {AssertError, DefinitionError, MergeError} from '../lib/errors';
import type {SchemaDomain} from '../SchemaDomain';
import {InferListDefinitionType, InferValidatorReturnType} from '../lib/types';
import {NeverValidator} from './Never';

export interface IntersectValidatorDefinition<
	VARIANTS extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'intersect';
	variants: VARIANTS;
}

export class IntersectValidator<
	VARIANTS = unknown,
	VARIANTSDEFINITION extends readonly Definition[] = readonly Definition[]
> extends Validator<VARIANTS> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): IntersectValidator {
		const validatorInstance = new IntersectValidator();

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
	): IntersectValidator<InferValidatorReturnType<V[number]>, InferListDefinitionType<V>> {
		this._variants = variants;

		return this as unknown as IntersectValidator<
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
			} catch (e) {
				errors.push(e as Error);
			}
		}

		if (errors.length > 0)
			throw new AssertError(`Expected to match all Intersect Variants`, path, {cause: errors});
	}

	public isSameValidator(other: Validator): other is IntersectValidator {
		return this.constructor === other.constructor;
	}

	public clone(): this {
		const validator = new IntersectValidator() as this;

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
		if (variant instanceof NeverValidator) {
			variants.length = 0;
			variants.push(variant);
			return;
		}

		if (variant instanceof IntersectValidator) {
			for (const child of variant._variants)
				this._pushVariant(variants, child);

			return;
		}

		if (!variants.some(existing => existing.isEqual(variant)))
			variants.push(variant);
	}

	public merge(other: Validator, _path: string = 'validator'): Validator {
		const variants = [...this._variants];

		this._pushVariant(variants, other);

		return new IntersectValidator()
			.variants(variants)
			.normalize();
	}

	public normalize(): Validator {
		let merged: Validator | null = null;

		for (const variant of this._variants) {
			const normalized = variant.normalize();

			if (normalized instanceof NeverValidator)
				return normalized;

			if (normalized instanceof IntersectValidator) {
				for (const child of normalized._variants) {
					merged = merged === null
						? child
						: merged.merge(child, 'validator.variants').normalize();
				}

				continue;
			}

			try {
				merged = merged === null
					? normalized
					: merged.merge(normalized, 'validator.variants').normalize();
			} catch (e) {
				if (e instanceof MergeError)
					return new NeverValidator();

				throw e;
			}
		}

		if (merged === null)
			return new NeverValidator();

		return merged;
	}

	protected override _isSubset(other: Validator): boolean {
		const normalized = this.normalize();

		if (normalized instanceof IntersectValidator)
			return normalized._variants.every(variant => variant.isSubset(other));

		return normalized.isSubset(other);
	}

	public toJSON(): IntersectValidatorDefinition<VARIANTSDEFINITION> {
		const definition: IntersectValidatorDefinition = {
			type: 'intersect',
			variants: this._variants.map(variant => variant.toJSON())
		};

		return definition as IntersectValidatorDefinition<VARIANTSDEFINITION>;
	}
}