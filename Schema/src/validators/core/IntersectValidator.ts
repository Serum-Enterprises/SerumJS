import {Validator, type InferValidatorResult} from "../Validator";
import {AssertError} from "../../lib/errors";

interface IntersectValidatorConstraints {
	readonly variants: readonly [Validator, ...Validator[]];
}

type UnionToIntersection<UNION> =
	(
		UNION extends unknown
			? (value: UNION) => void
			: never
		) extends (value: infer INTERSECTION) => void
		? INTERSECTION
		: never;

type IntersectValidatorResult<C extends IntersectValidatorConstraints> =
	C extends {
			readonly variants: infer VARIANTS extends readonly Validator[];
		}
		? UnionToIntersection<InferValidatorResult<VARIANTS[number]>>
		: never;

export class IntersectValidator<
	const C extends IntersectValidatorConstraints
> extends Validator<IntersectValidatorResult<C>> {
	public constructor(
		public readonly constraints: C
	) {
		super();
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
}
