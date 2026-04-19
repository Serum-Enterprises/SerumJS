abstract class BaseOption<T> {
	public isSome(): this is Some<T> {
		return this instanceof Some;
	}

	public isNone(): this is None {
		return this instanceof None;
	}

	public onSome(fn: (value: T) => void): this {
		if (this.isSome())
			fn((this as Some<T>).value);

		return this;
	}

	public onNone(fn: () => void): this {
		if (this.isNone())
			fn();

		return this;
	}

	public map<R>(fn: (value: T) => R): Option<R> {
		return this.match<Option<R>>(
			value => Option.Some(fn(value)),
			() => Option.None()
		);
	}

	public match<R>(onSome: (value: T) => R, onNone: () => R): R {
		if (this.isSome())
			return onSome((this as Some<T>).value);
		else
			return onNone();
	}

	public equals<O>(
		other: Option<O>,
		fn: (a: T, b: O) => boolean = (a, b) => Object.is(a, b)
	): boolean {
		if (this.isNone() && other.isNone())
			return true;

		if (this.isSome() && other.isSome())
			return fn(this.value, other.value);

		return false;
	}
}

export class Some<T> extends BaseOption<T> {
	public constructor(
		public readonly value: T
	) { super(); }
}

export class None extends BaseOption<never> {}

export type Option<T> = Some<T> | None;

export const Option = {
	Some<T>(value: T): Some<T> {
		return new Some(value);
	},
	None(): None {
		return new None();
	}
}