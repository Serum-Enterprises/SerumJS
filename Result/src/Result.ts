export abstract class Result<T, E> {
	static Ok<T>(value: T): Ok<T> {
		return new Ok(value);
	}

	static Err<E>(error: E): Err<E> {
		return new Err(error);
	}

	isOk(): this is Ok<T> {
		return this instanceof Ok;
	}

	isErr(): this is Err<E> {
		return this instanceof Err;
	}

	onOk(fn: (value: T) => void): this {
		if (this.isOk())
			fn((this as Ok<T>).value);

		return this;
	}

	onErr(fn: (error: E) => void): this {
		if (this.isErr())
			fn((this as Err<E>).error);

		return this;
	}

	mapOk<R>(fn: (value: T) => R): Result<R, E> {
		return this.match<Result<R, E>>(
			value => Result.Ok(fn(value)),
			error => Result.Err(error)
		);
	}

	mapErr<F>(fn: (error: E) => F): Result<T, F> {
		return this.match<Result<T, F>>(
			value => Result.Ok(value),
			error => Result.Err(fn(error))
		);
	}

	match<R>(onOk: (value: T) => R, onErr: (error: E) => R): R {
		if (this.isOk())
			return onOk((this as Ok<T>).value);
		else
			return onErr((this as unknown as Err<E>).error);
	}
}

class Ok<T> extends Result<T, never> {
	#value: T;

	constructor(value: T) {
		super();
		this.#value = value;
	}

	get value(): T {
		return this.#value;
	}
}

class Err<E> extends Result<never, E> {
	#error: E;

	constructor(error: E) {
		super();
		this.#error = error;
	}

	get error(): E {
		return this.#error;
	}
}