import {JSON} from '@serum-enterprises/json';
import {Validator} from '../Validator';
import {AssertError, DefinitionError} from '../lib/errors';
import type {Domain} from '../Domain';
import {Definition, InferListDefinitionType, InferValidatorReturnType, UnknownDefinition} from '../lib/types';

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
		domain: Domain
	): IntersectValidator {
		if (!JSON.isArray(definition['variants']))
			throw new DefinitionError(`Expected an Array`, `${path}.variants`);

		return new IntersectValidator({
			variants: definition['variants'].map((variant, index) => {
				return domain.fromJSON(variant, `${path}.variants[${index}]`)
			})
		});
	}

	public constructor(
		public readonly rules: { readonly variants: readonly Validator[] } = {variants: []}
	) {super();}

	public variants<const V extends Validator[]>(
		variants: V
	): IntersectValidator<InferValidatorReturnType<V[number]>, InferListDefinitionType<V>> {
		return new IntersectValidator({variants});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is VARIANTS {
		if (this.rules.variants.length === 0)
			throw new AssertError(`Expected at least one Variant`, `${path}.variants`);

		const errors: Error[] = [];

		for (const variant of this.rules.variants) {
			try {
				variant.assert(data, path);
			} catch (e) {
				errors.push(e as Error);
			}
		}

		if (errors.length > 0)
			throw new AssertError(`Expected to match all Intersect Variants`, path, {cause: errors});
	}

	public clone(): this {
		return new IntersectValidator({
			variants: this.rules.variants.map(v => v.clone())
		}) as this;
	}

	public toJSON(): IntersectValidatorDefinition<VARIANTSDEFINITION> {
		const definition: IntersectValidatorDefinition = {
			type: 'intersect',
			variants: this.rules.variants.map(variant => variant.toJSON())
		};

		return definition as IntersectValidatorDefinition<VARIANTSDEFINITION>;
	}
}