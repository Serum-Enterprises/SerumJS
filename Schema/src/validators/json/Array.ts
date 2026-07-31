import {JSON} from "@serum-enterprises/json";
import type {InferDefinitionType, InferValidatorReturnType, InferListDefinitionType, InferListReturnType, UnknownDefinition, Definition} from "../../lib/types";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";
import type {Domain} from "../../Domain";

type ArrayResult<E, T> =
	T extends readonly unknown[]
		? [...{ [K in keyof T]: T[K] & E }, ...E[]]
		: E[];

export interface ArrayValidatorDefinition<
	// Every & Tuple Definitions (as E & T)
	EVERYDEFINITION extends Definition = Definition,
	TUPLEDEFINITION extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: "array";
	min?: number;
	max?: number;
	every?: EVERYDEFINITION;
	tuple?: TUPLEDEFINITION;
}

export interface ArrayValidatorRules {
	min: number | null;
	max: number | null;
	every: Validator | null;
	tuple: Validator[] | null;
}

export class ArrayValidator<
	EVERY = unknown,
	TUPLE = unknown,
	EVERYDEFINITION extends Definition = Definition,
	TUPLEDEFINITION extends readonly Definition[] = readonly Definition[],
> extends Validator<ArrayResult<EVERY, TUPLE>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = "definition",
		schemaDomain: Domain
	): ArrayValidator {
		const rules: {
			min: number | null;
			max: number | null;
			every: Validator | null;
			tuple: Validator[] | null;
		} = {
			min: null,
			max: null,
			every: null,
			tuple: null
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

		if ("every" in definition)
			rules.every = schemaDomain.fromJSON(definition["every"], `${path}.every`);

		if ("tuple" in definition) {
			if (!JSON.isShallowArray(definition["tuple"]))
				throw new DefinitionError("Expected an Array", `${path}.tuple`);

			const tupleSchemas: Validator[] = [];
			const errors: DefinitionError[] = [];

			definition["tuple"].forEach((tupleDef, index) => {
				try {
					tupleSchemas.push(schemaDomain.fromJSON(tupleDef, `${path}.tuple[${index}]`));
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});

			if (errors.length > 0)
				throw new AggregateError(errors);

			if (tupleSchemas.length > 0)
				rules.tuple = tupleSchemas;
		}

		return new ArrayValidator(rules);
	}

	public constructor(
		public readonly rules: {
			readonly min: number | null;
			readonly max: number | null;
			readonly every: Validator | null;
			readonly tuple: (readonly Validator[]) | null;
		} = {
			min: null,
			max: null,
			every: null,
			tuple: null
		}
	) {
		super();
	}

	public min(min: number): ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION> {
		return new ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION>({...this.rules, min});
	}

	public max(max: number): ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION> {
		return new ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION>({...this.rules, max});
	}

	public every<const V extends Validator>(every: V): ArrayValidator<InferValidatorReturnType<V>, TUPLE, InferDefinitionType<V>, TUPLEDEFINITION> {
		return new ArrayValidator<InferValidatorReturnType<V>, TUPLE, InferDefinitionType<V>, TUPLEDEFINITION>({
			...this.rules,
			every
		});
	}

	public tuple<const V extends readonly Validator[]>(tuple: V): ArrayValidator<EVERY, InferListReturnType<V>, EVERYDEFINITION, InferListDefinitionType<V>> {
		return new ArrayValidator<EVERY, InferListReturnType<V>, EVERYDEFINITION, InferListDefinitionType<V>>({
			...this.rules,
			tuple
		});
	}

	public assert(data: unknown, path: string = "data"): asserts data is TUPLE {
		if (!JSON.isShallowArray(data))
			throw new AssertError("Expected an Array", path);

		if (this.rules.min !== null && this.rules.min > data.length)
			throw new AssertError(`Expected at least ${this.rules.min} elements`, path);

		if (this.rules.max !== null && this.rules.max < data.length)
			throw new AssertError(`Expected at most ${this.rules.max} elements`, path);

		const errors: AssertError[] = [];

		if (this.rules.every !== null) {
			const validator: Validator = this.rules.every;

			data.forEach((value, index) => {
				try {
					validator.assert(value, `${path}[${index}]`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});
		}

		if (this.rules.tuple !== null) {
			if (data.length < this.rules.tuple.length)
				throw new AssertError(`Expected at least ${this.rules.tuple.length} elements`, path);

			this.rules.tuple.forEach((validator: Validator, index) => {
				try {
					validator.assert(data[index], `${path}[${index}]`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			});
		}

		if (errors.length > 0)
			throw new AggregateError(errors);
	}

	public clone(): this {
		return new ArrayValidator<EVERY, TUPLE, EVERYDEFINITION, TUPLEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			tuple: this.rules.tuple ? this.rules.tuple.map(v => v.clone()) : this.rules.tuple
		}) as this;
	}

	public toJSON(): ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION> {
		const definition: ArrayValidatorDefinition = {
			type: "array"
		};

		if (this.rules.min !== null)
			definition.min = this.rules.min;

		if (this.rules.max !== null)
			definition.max = this.rules.max;

		if (this.rules.every !== null)
			definition.every = this.rules.every.toJSON();

		if (this.rules.tuple !== null)
			definition.tuple = this.rules.tuple.map(v => v.toJSON());

		return definition as ArrayValidatorDefinition<EVERYDEFINITION, TUPLEDEFINITION>;
	}
}