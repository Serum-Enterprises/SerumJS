import {JSON} from "@serum-enterprises/json";
import {Definition, UnknownDefinition} from "../../lib/types";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";
import type {Domain} from "../../Domain";

export interface NumberValidatorDefinition extends Definition {
	type: "number";
	integer?: boolean;
	min?: number;
	max?: number;
	equals?: number;
}

export class NumberValidator<T extends number = number> extends Validator<T> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = "definition",
		_schemaDomain: Domain
	): NumberValidator {
		const rules: {
			integer: boolean;
			min: number | null;
			max: number | null;
			equals: number | null;
		} = {
			integer: false,
			min: null,
			max: null,
			equals: null
		};

		if ("integer" in definition) {
			if (!JSON.isBoolean(definition["integer"]))
				throw new DefinitionError("Expected a Boolean", `${path}.integer`);

			rules.integer = definition["integer"];
		}

		if ("min" in definition) {
			if (!JSON.isNumber(definition["min"]))
				throw new DefinitionError("Expected a Number", `${path}.min`);

			rules.min = definition["min"];
		}

		if ("max" in definition) {
			if (!JSON.isNumber(definition["max"]))
				throw new DefinitionError("Expected a Number", `${path}.max`);

			rules.max = definition["max"];
		}

		if ("equals" in definition) {
			if (!JSON.isNumber(definition["equals"]))
				throw new DefinitionError("Expected a Number", `${path}.equals`);

			rules.equals = definition["equals"];
		}

		return new NumberValidator(rules);
	}

	public constructor(
		public readonly rules: {
			readonly integer: boolean;
			readonly min: number | null;
			readonly max: number | null;
			readonly equals: number | null;
		} = {
			integer: false,
			min: null,
			max: null,
			equals: null
		}
	) {
		super();
	}

	public integer(integer: boolean = true): NumberValidator<T> {
		return new NumberValidator({...this.rules, integer});
	}

	public min(min: number): NumberValidator<T> {
		return new NumberValidator<T>({...this.rules, min});
	}

	public max(max: number): NumberValidator<T> {
		return new NumberValidator({...this.rules, max});
	}

	public equals<const V extends number>(equals: V): NumberValidator<V> {
		return new NumberValidator<V>({...this.rules, equals});
	}

	public assert(data: unknown, path: string = "data"): asserts data is T {
		if (!JSON.isNumber(data))
			throw new AssertError("Expected a Number", path);

		if (this.rules.integer && !Number.isInteger(data))
			throw new AssertError("Expected an Integer", path);

		if (this.rules.min !== null && this.rules.min > data)
			throw new AssertError(`Expected at least ${this.rules.min}`, path);

		if (this.rules.max !== null && this.rules.max < data)
			throw new AssertError(`Expected at most ${this.rules.max}`, path);

		if (this.rules.equals !== null && this.rules.equals !== data)
			throw new AssertError(`Expected ${this.rules.equals}`, path);
	}

	public clone(): this {
		return new NumberValidator({...this.rules}) as this;
	}

	public toJSON(): NumberValidatorDefinition {
		const definition: NumberValidatorDefinition = {
			type: "number"
		};

		if (this.rules.integer)
			definition["integer"] = true;

		if (this.rules.min !== null)
			definition["min"] = this.rules.min;

		if (this.rules.max !== null)
			definition["max"] = this.rules.max;

		if (this.rules.equals !== null)
			definition["equals"] = this.rules.equals;

		return definition;
	}
}