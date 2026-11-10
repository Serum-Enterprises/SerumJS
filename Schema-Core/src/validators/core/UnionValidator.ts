import type {Domain} from "../../Domain";
import type {JSON} from "../../lib/JSON";
import {Validator, type InferValidatorResult, type ValidatorDefinition} from "../Validator";
import {AssertError, DefinitionError} from "../../lib/errors";

export interface UnionValidatorConstraints {
	readonly variants: readonly [Validator, ...Validator[]];
}

type UnionValidatorResult<C extends UnionValidatorConstraints> =
	C extends {
		readonly variants: infer VARIANTS extends readonly Validator[];
	}
		? InferValidatorResult<VARIANTS[number]>
		: never;

export class UnionValidator<
	const C extends UnionValidatorConstraints
> extends Validator<UnionValidatorResult<C>> {
	public static fromJSON(
		definition: { type: "union" } & Record<string, JSON>,
		path: string,
		domain: Domain
	): UnionValidator<UnionValidatorConstraints> {
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
				`Expected ${path} to be a valid UnionValidatorDefinition`
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
				`Expected ${path} to be a valid UnionValidatorDefinition`
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
				`Expected ${path} to be a valid UnionValidatorDefinition`
			);

		return new UnionValidator({
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

	public variants<const V extends readonly [Validator, ...Validator[]]>(variants: V): UnionValidator<{
		readonly variants: readonly [...V]
	}> {
		return new UnionValidator<{ readonly variants: readonly [...V] }>({variants: [...variants]});
	}

	public assert(value: unknown, path: string = "value"): asserts value is UnionValidatorResult<C> {
		const errors: Error[] = [];

		for (const variant of this.constraints.variants) {
			try {
				const validator: Validator = variant;

				validator.assert(value, path);
				return;
			} catch (error) {
				if (error instanceof AssertError || error instanceof AggregateError)
					errors.push(error);
				else
					throw error;
			}
		}

		throw new AggregateError(
			errors,
			`Expected ${path} to satisfy at least one union variant`
		);
	}

	public toJSON(): {
		type: "union",
		variants: [
			ValidatorDefinition,
			...ValidatorDefinition[]
		]
	} {
		const [first, ...remaining] = this.constraints.variants;

		return {
			type: "union",
			variants: [
				first.toJSON(),
				...remaining.map((variant) => variant.toJSON())
			]
		};
	}
}
