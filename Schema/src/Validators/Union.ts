import {JSON} from '@serum-enterprises/json';
import {Option} from '@serum-enterprises/option';
import {Validator} from '../Validator';
import {fromJSON} from '../lib/fromJSON';
import {AssertError, DefinitionError} from '../lib/util';
import {JSONValidator} from './JSON';
import {Definition, UnionValidatorDefinition} from '../Definitions';

export class UnionValidator<T = unknown> extends Validator<T> {
	public static fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition'
	): UnionValidator {
		const validatorInstance = new UnionValidator();

		if ('nullable' in definition) {
			if (!JSON.isBoolean(definition['nullable']))
				throw new DefinitionError(`Expected ${path}.nullable to be a Boolean`);

			if (definition['nullable'])
				validatorInstance._nullable = Option.Some(null);
		}

		if (!JSON.isArray(definition['variants']))
			throw new DefinitionError(`Expected ${path}.variants to be an Array`);

		validatorInstance._variants = definition['variants'].map((variant, index) =>
			fromJSON(variant, `${path}.variants[${index}]`)
		);

		return validatorInstance;
	}

	protected _nullable: Option<null> = Option.None();
	protected _variants: Validator[] = [];

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (JSON.isNull(data)) {
			if (this._nullable.isSome())
				return;

			throw new AssertError(`Expected ${path} to be one of the Union Variants or Null`);
		}

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

		throw new AssertError(`Expected ${path} to match at least one Union Variant (see cause)`, {cause: errors});
	}

	protected _isSubset(other: Validator): boolean {
		if (other instanceof JSONValidator)
			return true;

		const otherWithNullable = other as Validator & { _nullable?: Option<null> };

		// Rule: A | B ⊆ Other <=> A ⊆ Other AND B ⊆ Other
		// (Assuming this union handles nullability as well)
		if (this._nullable.isSome() && !otherWithNullable._nullable?.isSome())
			return false;

		// Every member of this union must be a subset of the target
		return this._variants.every(variant => variant.isSubset(other));
	}

	public toJSON(): UnionValidatorDefinition {
		const definition: UnionValidatorDefinition = {
			type: 'union',
			variants: this._variants.map(variant => variant.toJSON())
		};

		if (this._nullable.isSome())
			definition.nullable = true;

		return definition;
	}
}