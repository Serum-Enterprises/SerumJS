import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator, type InferValidatorResult, type ValidatorDefinition} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface IntersectValidatorConstraints {
	readonly variants: readonly [Validator, ...Validator[]];
}

type IntersectValidatorResults<VARIANTS extends readonly Validator[]> =
	VARIANTS extends readonly [infer FIRST extends Validator, ...infer REST extends readonly Validator[]]
		? InferValidatorResult<FIRST> & IntersectValidatorResults<REST>
		: unknown;

type IntersectValidatorResult<C extends IntersectValidatorConstraints> =
	C extends {
			readonly variants: infer VARIANTS extends readonly Validator[];
		}
		? IntersectValidatorResults<VARIANTS>
		: never;

export class IntersectValidator<
	const C extends IntersectValidatorConstraints
> extends Validator<IntersectValidatorResult<C>> {
	public static readonly type = "intersect";

	public static fromJSON(
		definition: { type: "intersect" } & Record<string, JSON>,
		path: string,
		domain: Domain
	): IntersectValidator<IntersectValidatorConstraints> {
		const errors: (DefinitionError | AggregateError)[] = [];

		// Report invalid Constraints
		for (const key of Object.keys(definition)) {
			if (!["type", "variants"].includes(key))
				errors.push(new DefinitionError(
					`Unknown Property ${path}.${key}`,
					`${path}.${key}`
				));
		}

		// Verify variants exist
		if (!Object.hasOwn(definition, "variants") || !Array.isArray(definition["variants"])) {
			errors.push(new DefinitionError(
				`Expected ${path}.variants to be an Array`,
				`${path}.variants`
			));

			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid IntersectValidatorDefinition`
			);
		}

		// Verify there is at least one Variant
		if (definition["variants"].length < 1) {
			errors.push(new DefinitionError(
				`Expected ${path}.variants to contain at least one ValidatorDefinition`,
				`${path}.variants`
			));

			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid IntersectValidatorDefinition`
			);
		}

		const variants: Validator[] = [];

		// Verify every Variant
		for (let index = 0; index < definition["variants"].length; index++) {
			try {
				variants.push(
					domain.fromJSON(
						definition["variants"][index]!,
						`${path}.variants[${index}]`
					)
				);
			} catch (error) {
				if (error instanceof DefinitionError || error instanceof AggregateError)
					errors.push(error);
				else
					throw error;
			}
		}

		// Throw if there are any Errors
		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to be a valid IntersectValidatorDefinition`
			);

		return new IntersectValidator({
			variants: variants as [Validator, ...Validator[]]
		});
	}

	public constructor(
		public readonly constraints: C
	) {
		super();

		this.constraints = Object.freeze({
			...constraints,
			variants: Object.freeze([...constraints.variants])
		});
	}

	public variants<const V extends readonly [Validator, ...Validator[]]>(variants: V): IntersectValidator<{
		readonly variants: readonly [...V]
	}> {
		return new IntersectValidator<{ readonly variants: readonly [...V] }>({variants: [...variants]});
	}

	public assert(value: unknown, path: string = "value"): asserts value is IntersectValidatorResult<C> {
		const errors: Error[] = [];

		for (const variant of this.constraints.variants) {
			try {
				const validator: Validator = variant;

				validator.assert(value, path);
			} catch (error) {
				if (error instanceof AssertError || error instanceof AggregateError)
					errors.push(error);
				else
					throw error;
			}
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected ${path} to satisfy every intersection variant`
			);
	}

	public toJSON(): {
		type: "intersect",
		variants: [
			ValidatorDefinition,
			...ValidatorDefinition[]
		]
	} {
		const [first, ...remaining] = this.constraints.variants;

		return {
			type: "intersect",
			variants: [
				first.toJSON(),
				...remaining.map((variant) => variant.toJSON())
			]
		};
	}
}
