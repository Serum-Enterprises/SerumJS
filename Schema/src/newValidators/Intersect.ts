import {JSON} from '@serum-enterprises/json';
import type {SchemaDomain} from '../SchemaDomain';
import {type Definition, type UnknownDefinition, Validator} from '../Validator';
import {DefinitionError} from "../lib/errors";

type IntersectTuple<T extends readonly unknown[]> =
	T extends readonly [infer HEAD, ...infer TAIL]
		? HEAD & IntersectTuple<TAIL>
		: unknown;

export interface IntersectValidatorDefinition<
	VARIANTSDEFINITION extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'intersect',
	variants?: VARIANTSDEFINITION
}

export class IntersectValidator<
	VARIANTS extends readonly unknown[] = unknown[],
	VARIANTSDEFINITION extends readonly Definition[] = Definition[]
> extends Validator<IntersectTuple<VARIANTS>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		schemaDomain: SchemaDomain
	): Validator {
		const validator = new IntersectValidator();

		if ('variants' in definition) {
			if (!JSON.isShallowArray(definition['variants']))
				throw new DefinitionError(`Expected an Array`, `${path}.variants`);

			const variantSchemas: Validator[] = [];
			const errors: Error[] = [];

			definition['variants'].forEach((definition, index) => {
				try {
					variantSchemas.push(schemaDomain.fromJSON(definition, `${path}.variants[${index}]`));
				} catch (e) {
					if (e instanceof Error)
						errors.push(e);
					else
						errors.push(new DefinitionError(`Unknown Error thrown`, `${path}.variants[${index}]`, {cause: e}));
				}
			});

			if (errors.length > 0)
				throw new AggregateError(errors);

			validator._variants = variantSchemas;
		}

		return validator;
	}

	protected _variants: (readonly Validator[]) = [];

	public isEqual(other: Validator): other is this {
		if (!this.isSameSubclass(other))
			return false;

		let result = true;

		if (this._variants === null || other._variants === null)
			result = result && this._variants === other._variants;
		else {
			const otherTuple = other._variants;

			result = result && this._variants.length === otherTuple.length;

			for (let index = 0; index < this._variants.length && result; index++) {
				const left = this._variants[index];
				const right = otherTuple[index];

				result = result && right !== undefined && left !== undefined && left.isEqual(right);
			}
		}

		return result;
	}

	public clone(): this {
		const validator = new IntersectValidator() as this;

		validator._variants = this._variants.map(v => v.clone());

		return validator;
	}

	public toJSON(): IntersectValidatorDefinition<VARIANTSDEFINITION> {
		const definition: IntersectValidatorDefinition = {
			type: 'intersect'
		};

		if (this._variants.length > 0)
			definition.variants = this._variants.map(v => v.toJSON());

		return definition as IntersectValidatorDefinition<VARIANTSDEFINITION>;
	}
}