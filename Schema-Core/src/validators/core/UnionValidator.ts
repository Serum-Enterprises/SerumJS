import {Validator, type InferValidatorResult, type ValidatorDefinition} from "../Validator";
import {AssertError} from "../../lib/errors";

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
