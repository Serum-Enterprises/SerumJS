import {Validator, type InferValidatorResult} from "../Validator";
import {AssertError} from "../../lib/errors";

export interface ArrayValidatorConstraints {
	readonly min?: number | undefined;
	readonly max?: number | undefined;
	readonly every?: Validator | undefined;
	readonly tuple?: readonly Validator[] | undefined;
}

type TupleElements<TUPLE extends readonly Validator[], EVERY> = {
	-readonly [K in keyof TUPLE]: InferValidatorResult<TUPLE[K]> & EVERY;
};

type ArrayValidatorResult<C extends ArrayValidatorConstraints> =
	C extends {readonly every: infer EVERY extends Validator}
		? C extends {readonly tuple: infer TUPLE extends readonly Validator[]}
			? [
				...TupleElements<TUPLE, InferValidatorResult<EVERY>>,
				...InferValidatorResult<EVERY>[]
			]
			: InferValidatorResult<EVERY>[]
		: C extends {readonly tuple: infer TUPLE extends readonly Validator[]}
			? [...TupleElements<TUPLE, unknown>, ...unknown[]]
			: unknown[];

export class ArrayValidator<
	const C extends ArrayValidatorConstraints = {}
> extends Validator<ArrayValidatorResult<C>> {
	public constructor(
		public readonly constraints: C
	) {
		super();
		this.constraints = Object.freeze({
			...constraints,
			...(constraints.tuple !== undefined
				? {tuple: Object.freeze([...constraints.tuple])}
				: {})
		});
	}

	public min<const M extends number>(min: M): ArrayValidator<
		Omit<C, "min"> & {readonly min: M}
	> {
		return new ArrayValidator<
			Omit<C, "min"> & {readonly min: M}
		>({
			...this.constraints,
			min
		});
	}

	public max<const M extends number>(max: M): ArrayValidator<
		Omit<C, "max"> & {readonly max: M}
	> {
		return new ArrayValidator<
			Omit<C, "max"> & {readonly max: M}
		>({
			...this.constraints,
			max
		});
	}

	public every<const E extends Validator>(every: E): ArrayValidator<
		Omit<C, "every"> & {readonly every: E}
	> {
		return new ArrayValidator<
			Omit<C, "every"> & {readonly every: E}
		>({
			...this.constraints,
			every
		});
	}

	public tuple<const T extends readonly Validator[]>(tuple: T): ArrayValidator<
		Omit<C, "tuple"> & {readonly tuple: readonly [...T]}
	> {
		return new ArrayValidator<
			Omit<C, "tuple"> & {readonly tuple: readonly [...T]}
		>({
			...this.constraints,
			tuple: [...tuple]
		});
	}

	public assert(value: unknown, path: string = "value"): asserts value is ArrayValidatorResult<C> {
		if (!Array.isArray(value))
			throw new AssertError(`Expected ${path} to be an Array`, path);

		if (this.constraints.min !== undefined && this.constraints.min > value.length)
			throw new AssertError(`Expected ${path} to contain at least ${this.constraints.min} elements`, path);

		if (this.constraints.max !== undefined && this.constraints.max < value.length)
			throw new AssertError(`Expected ${path} to contain at most ${this.constraints.max} elements`, path);

		if (this.constraints.tuple !== undefined && value.length < this.constraints.tuple.length)
			throw new AssertError(
				`Expected ${path} to contain at least ${this.constraints.tuple.length} elements`,
				path
			);

		const errors: Error[] = [];

		if (this.constraints.every !== undefined) {
			for (let index = 0; index < value.length; index++) {
				try {
					const validator: Validator = this.constraints.every;

					validator.assert(value[index], `${path}[${index}]`);
				} catch (error) {
					if (error instanceof AssertError || error instanceof AggregateError)
						errors.push(error);
					else
						throw error;
				}
			}
		}

		if (this.constraints.tuple !== undefined) {
			for (let index = 0; index < this.constraints.tuple.length; index++) {
				try {
					const validator: Validator = this.constraints.tuple[index]!;

					validator.assert(value[index], `${path}[${index}]`);
				} catch (error) {
					if (error instanceof AssertError || error instanceof AggregateError)
						errors.push(error);
					else
						throw error;
				}
			}
		}

		if (errors.length > 0)
			throw new AggregateError(
				errors,
				`Expected all elements of ${path} to satisfy their constraints`
			);
	}

	public toJSON(): {
		type: "array",
		min?: number,
		max?: number,
		every?: ReturnType<Validator["toJSON"]>,
		tuple?: ReturnType<Validator["toJSON"]>[]
	} {
		const result: {
			type: "array",
			min?: number,
			max?: number,
			every?: ReturnType<Validator["toJSON"]>,
			tuple?: ReturnType<Validator["toJSON"]>[]
		} = {
			type: "array"
		};

		if (this.constraints.min !== undefined)
			result["min"] = this.constraints.min;

		if (this.constraints.max !== undefined)
			result["max"] = this.constraints.max;

		if (this.constraints.every !== undefined)
			result["every"] = this.constraints.every.toJSON();

		if (this.constraints.tuple !== undefined)
			result["tuple"] = this.constraints.tuple.map((validator) => validator.toJSON());

		return result;
	}
}
