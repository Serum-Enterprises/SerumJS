export abstract class Option<T> {
	static Some<T>(value: T): Some<T> {
		return new Some(value);
	}

	static None(): None {
		return new None();
	}

	isSome(): this is Some<T> {
		return this instanceof Some;
	}

	isNone(): this is None {
		return this instanceof None;
	}

	onSome(fn: (value: T) => void): this {
		if (this.isSome())
			fn((this as Some<T>).value);

		return this;
	}

	onNone(fn: () => void): this {
		if (this.isNone())
			fn();

		return this;
	}

	map<R>(fn: (value: T) => R): Option<R> {
		return this.match<Option<R>>(
			value => Option.Some(fn(value)),
			() => Option.None()
		);
	}

	match<R>(onSome: (value: T) => R, onNone: () => R): R {
		if (this.isSome())
			return onSome((this as Some<T>).value);
		else
			return onNone();
	}
}

export class Some<T> extends Option<T> {
	#value: T;

	constructor(value: T) {
		super();
		this.#value = value;
	}

	get value(): T {
		return this.#value;
	}
}

export class None extends Option<never> { }