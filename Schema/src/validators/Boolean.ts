import {JSON} from '@serum-enterprises/json';
import {Validator} from '../Validator';
import {AssertError, DefinitionError, MergeError} from '../lib/errors';
import type {Domain} from '../Domain';
import {Definition, UnknownDefinition} from "../lib/types";
import {JSONValidator} from "./JSON";

export interface BooleanValidatorDefinition extends Definition {
	type: 'boolean';
	equals?: boolean;
}

interface BooleanValidatorRules {
	equals: boolean | null;
}

export class BooleanValidator<T extends boolean = boolean> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = 'definition',
		_schemaDomain: Domain
	): BooleanValidator {
		if ('equals' in definition) {
			if (!JSON.isBoolean(definition['equals']))
				throw new DefinitionError(`Expected a Boolean`, `${path}.equals`);

			return new BooleanValidator({equals: definition['equals']});
		}

		return new BooleanValidator({equals: null});
	}

	public constructor(
		public readonly rules: Readonly<BooleanValidatorRules> = {equals: null}
	) {super()}

	public equals<const V extends boolean>(equals: V): BooleanValidator<V> {
		return new BooleanValidator<V>({...this.rules, equals});
	}

	public assert(data: unknown, path: string = 'data'): asserts data is T {
		if (typeof data !== 'boolean')
			throw new AssertError(`Expected a Boolean`, path);

		if (this.rules.equals !== null && this.rules.equals !== data)
			throw new AssertError(`Expected ${this.rules.equals}`, path);
	}

	public isEqual(other: Validator): other is this {
		if (!this.isSameValidator(other))
			return false;

		return this.rules.equals === other.rules.equals;
	}

	public clone(): this {
		return new BooleanValidator({...this.rules}) as this;
	}

	protected _merge(other: Validator, path: string = 'validator'): BooleanValidator {
		if (!this.isSameValidator(other))
			throw new MergeError(`Conflicting Validator Subclasses`, path, {cause: {left: this, right: other}});

		const rules: BooleanValidatorRules = {equals: null};

		if (this.rules.equals !== null && other.rules.equals !== null && this.rules.equals !== other.rules.equals)
			throw new MergeError(`Conflicting equals Constraints`, `${path}.equals`, {
				cause: {
					left: this.rules.equals,
					right: other.rules.equals
				}
			});

		rules.equals = this.rules.equals !== null ? this.rules.equals : other.rules.equals;

		return new BooleanValidator(rules);
	}

	public normalize(): Validator {
		return this.clone();
	}

	protected _isSubset(other: Validator): boolean {
		if(other instanceof JSONValidator)
			return true;

		if (!this.isSameValidator(other))
			return false;

		if (other.rules.equals === null)
			return true;

		if (this.rules.equals === null)
			return false;

		return this.rules.equals === other.rules.equals;
	}

	public toJSON(): BooleanValidatorDefinition {
		const definition: BooleanValidatorDefinition = {
			type: 'boolean'
		};

		if (this.rules.equals !== null)
			definition['equals'] = this.rules.equals;

		return definition;
	}
}