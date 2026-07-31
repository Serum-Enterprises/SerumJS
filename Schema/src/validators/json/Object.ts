import {JSON} from "@serum-enterprises/json";
import type {Definition, UnknownDefinition, InferDefinitionType, InferValidatorReturnType} from "../../lib/types";
import type {Domain} from "../../Domain";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

type ShapeResult<S> =
	S extends Record<string, Validator>
		? { [K in keyof S]: InferValidatorReturnType<S[K]> }
		: Record<string, unknown>;

type ObjectResult<EVERY, SHAPE, EXACT extends boolean> =
	EXACT extends true
		? ShapeResult<SHAPE>
		: ShapeResult<SHAPE> & Record<string, EVERY>;

type ShapeDefinition<S> =
	S extends Record<string, Validator>
		? { [K in keyof S]: InferDefinitionType<S[K]> }
		: Record<string, Definition>;

export interface ObjectValidatorDefinition<
	EVERYDEFINITION extends Definition = Definition,
	SHAPEDEFINITION extends Record<string, Definition> = Record<string, Definition>
> extends Definition {
	type: "object";
	min?: number;
	max?: number;
	every?: EVERYDEFINITION;
	shape?: SHAPEDEFINITION;
	exact?: boolean;
}

export class ObjectValidator<
	EVERY = unknown,
	SHAPE = Record<string, unknown>,
	EXACT extends boolean = false,
	EVERYDEFINITION extends Definition = Definition,
	SHAPEDEFINITION extends Record<string, Definition> = Record<string, Definition>
> extends Validator<ObjectResult<EVERY, SHAPE, EXACT>> {
	public static fromJSON(
		definition: UnknownDefinition,
		path: string = "definition",
		schemaDomain: Domain
	): ObjectValidator {
		const rules: {
			min: number | null;
			max: number | null;
			every: Validator | null;
			shape: Record<string, Validator> | null;
			exact: boolean;
		} = {
			min: null,
			max: null,
			every: null,
			shape: null,
			exact: false
		};

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

		if ("shape" in definition) {
			if (!JSON.isShallowObject(definition["shape"]))
				throw new DefinitionError("Expected an Object", `${path}.shape`);

			const shape: Record<string, Validator> = {};
			const errors: DefinitionError[] = [];

			for (const [key, value] of Object.entries(definition["shape"])) {
				try {
					shape[key] = schemaDomain.fromJSON(value, `${path}.shape.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}

			if (errors.length > 0)
				throw new AggregateError(errors);

			rules.shape = shape;
		}

		if ("exact" in definition) {
			if (!JSON.isBoolean(definition["exact"]))
				throw new DefinitionError("Expected a Boolean", `${path}.exact`);

			rules.exact = definition["exact"];
		}

		return new ObjectValidator(rules);
	}

	public constructor(
		public readonly rules: {
			readonly min: number | null;
			readonly max: number | null;
			readonly every: Validator | null;
			readonly shape: Readonly<Record<string, Validator>> | null;
			readonly exact: boolean;
		} = {
			min: null,
			max: null,
			every: null,
			shape: null,
			exact: false
		}
	) {
		super();
	}

	public min(min: number): ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION> {
		return new ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
			min
		});
	}

	public max(max: number): ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION> {
		return new ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
			max
		});
	}

	public every<const V extends Validator>(
		every: V
	): ObjectValidator<
		InferValidatorReturnType<V>,
		SHAPE,
		EXACT,
		InferDefinitionType<V>,
		SHAPEDEFINITION
	> {
		return new ObjectValidator<
			InferValidatorReturnType<V>,
			SHAPE,
			EXACT,
			InferDefinitionType<V>,
			SHAPEDEFINITION
		>({
			...this.rules,
			every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
		});
	}

	public shape<const S extends Record<string, Validator>>(
		shape: S
	): ObjectValidator<
		EVERY,
		ShapeResult<S>,
		EXACT,
		EVERYDEFINITION,
		ShapeDefinition<S>
	> {
		return new ObjectValidator<
			EVERY,
			ShapeResult<S>,
			EXACT,
			EVERYDEFINITION,
			ShapeDefinition<S>
		>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			shape,
		});
	}

	public exact(): ObjectValidator<
		EVERY,
		SHAPE,
		true,
		EVERYDEFINITION,
		SHAPEDEFINITION
	> {
		return new ObjectValidator<EVERY, SHAPE, true, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			exact: true,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
		});
	}

	public assert(data: unknown, path: string = "data"): asserts data is ObjectResult<EVERY, SHAPE, EXACT> {
		if (!JSON.isShallowObject(data))
			throw new AssertError("Expected an Object", path);

		const keys = Object.keys(data);

		if (this.rules.min !== null && keys.length < this.rules.min)
			throw new AssertError(`Expected at least ${this.rules.min} properties`, path);

		if (this.rules.max !== null && keys.length > this.rules.max)
			throw new AssertError(`Expected at most ${this.rules.max} properties`, path);

		const errors: Error[] = [];

		if (this.rules.shape !== null) {
			for (const [key, validator] of Object.entries(this.rules.shape)) {
				if (!(key in data)) {
					errors.push(new AssertError("Expected property", `${path}.${key}`));
					continue;
				}

				try {
					const currentValidator: Validator = validator;

					currentValidator.assert(data[key], `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}
		}

		if (this.rules.exact && this.rules.shape !== null) {
			for (const key of keys) {
				if (!(key in this.rules.shape))
					errors.push(new AssertError("Unexpected property", `${path}.${key}`));
			}
		}

		if (this.rules.every !== null) {
			for (const [key, value] of Object.entries(data)) {
				try {
					const everyValidator: Validator = this.rules.every;

					everyValidator.assert(value, `${path}.${key}`);
				} catch (e) {
					errors.push(e instanceof Error ? e : new Error(String(e), {cause: e}));
				}
			}
		}

		if (errors.length > 0)
			throw new AggregateError(errors);
	}

	public clone(): this {
		return new ObjectValidator<EVERY, SHAPE, EXACT, EVERYDEFINITION, SHAPEDEFINITION>({
			...this.rules,
			every: this.rules.every ? this.rules.every.clone() : this.rules.every,
			shape: this.rules.shape ?
				Object.fromEntries(Object.entries(this.rules.shape).map(([key, value]) => [key, value.clone()])) :
				this.rules.shape,
		}) as this;
	}

	public toJSON(): ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION> {
		const definition: ObjectValidatorDefinition = {
			type: "object"
		};

		if (this.rules.min !== null)
			definition.min = this.rules.min;

		if (this.rules.max !== null)
			definition.max = this.rules.max;

		if (this.rules.every !== null)
			definition.every = this.rules.every.toJSON();

		if (this.rules.shape !== null) {
			const shape: Record<string, Definition> = {};

			for (const [key, value] of Object.entries(this.rules.shape))
				shape[key] = value.toJSON();

			definition.shape = shape;
		}

		if (this.rules.exact)
			definition.exact = true;

		return definition as ObjectValidatorDefinition<EVERYDEFINITION, SHAPEDEFINITION>;
	}
}