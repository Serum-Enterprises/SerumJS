import {JSON} from '@serum-enterprises/json';
import {Validator} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {Domain} from '../Domain';
import {Definition, InferListDefinitionType, InferValidatorReturnType, UnknownDefinition} from '../lib/types';

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
		schemaDomain: Domain
	): UnionValidator {
		if (!JSON.isArray(definition['variants']))
			throw new DefinitionError(`Expected an Array`, `${path}.variants`);

		return new UnionValidator({
			variants: definition['variants'].map((variant: unknown, index: number) => {
				return schemaDomain.fromJSON(variant, `${path}.variants[${index}]`)
			})
		});
	}

	public constructor(
		public readonly rules: { readonly variants: readonly Validator[] } = {variants: []}
	) {
		super();
	}

	public variants<const V extends Validator[]>(
		variants: V
	): UnionValidator<InferValidatorReturnType<V[number]>, InferListDefinitionType<V>> {
		return new UnionValidator({variants});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is VARIANTS {
		if (this.rules.variants.length === 0)
			throw new AssertError(`Expected at least one Variant`, `${path}.variants`);

		const errors: Error[] = [];

		for (const variant of this.rules.variants) {
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

	public clone(): this {
		return new UnionValidator({
			variants: this.rules.variants.map(v => v.clone())
		}) as this;
	}

	public toJSON(): UnionValidatorDefinition<VARIANTSDEFINITION> {
		const definition: UnionValidatorDefinition = {
			type: 'union',
			variants: this.rules.variants.map(variant => variant.toJSON())
		};

		return definition as UnionValidatorDefinition<VARIANTSDEFINITION>;
	}
}