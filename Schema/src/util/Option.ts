export abstract class Option<T> {
	public static Some<T>(value: T): Some<T> {
		return new Some(value);
	}

	public static None(): None {
		return new None();
	}

	public isSome(): this is Some<T> {
		return this instanceof Some;
	}
	public isNone(): this is None {
		return this instanceof None;
	}
}

export class Some<T> extends Option<T> {
	public constructor(
		private readonly _value: T
	) {
		super();
	}

	public get value(): T {
		return this._value;
	}
}

export class None extends Option<never> {}