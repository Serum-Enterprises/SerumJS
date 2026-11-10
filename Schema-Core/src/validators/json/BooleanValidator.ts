import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface BooleanValidatorConstraints {
	readonly equals?: boolean;
}

type BooleanValidatorResult<C extends BooleanValidatorConstraints> = C extends {
	readonly equals: infer E extends boolean;
} ? E : boolean;

export class BooleanValidator<
	const C extends BooleanValidatorConstraints = {}
> extends Validator<BooleanValidatorResult<C>> {
	public static fromJSON(
		definition: { type: "boolean" } & Record<string, JSON>,
		path: string,
		_domain: Domain
	): BooleanValidator<BooleanValidatorConstraints> {
		const errors: DefinitionError[] = [];
		const constraints: { equals?: boolean } = {};

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (!["type", "equals"].includes(key))
				errors.push(new DefinitionError(
					`Unknown Constraint ${path}.${key}`,
					`${path}.${key}`
				));
		}

		// Verify equals Constraint
		if (Object.hasOwn(definition, "equals")) {
			const equals = definition["equals"];

			if (typeof equals !== "boolean")
				errors.push(new DefinitionError(
					`Expected ${path}.equals to be a Boolean`,
					`${path}.equals`
				));
			else
				constraints.equals = equals;
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid BooleanValidatorDefinition`
			);

		return new BooleanValidator(constraints);
	}

	public constructor(
		public readonly constraints: C
	) {
		super();

		this.constraints = Object.freeze({...constraints});
	}

	public equals<const E extends boolean>(equals: E): BooleanValidator<{
		readonly equals: E
	}> {
		return new BooleanValidator<{ readonly equals: E }>({equals});
	}

	public assert(value: unknown, path: string = "value"): asserts value is BooleanValidatorResult<C> {
		if (typeof value !== "boolean")
			throw new AssertError(`Expected ${path} to be a Boolean`, path);

		if (this.constraints.equals !== undefined && this.constraints.equals !== value)
			throw new AssertError(`Expected ${path} to be ${this.constraints.equals}`, path);
	}

	public toJSON(): {
		type: "boolean",
		equals?: boolean
	} {
		const result: {
			type: "boolean",
			equals?: boolean
		} = {
			type: "boolean"
		};

		if (this.constraints.equals !== undefined)
			result["equals"] = this.constraints.equals;

		return result;
	}
}
