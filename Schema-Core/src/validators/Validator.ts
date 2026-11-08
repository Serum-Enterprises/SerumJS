export abstract class Validator<T = unknown> {
	public abstract assert(value: unknown, path?: string): asserts value is T;

	public validate(value: unknown, path: string = "value"): T {
		this.assert(value, path);

		return value;
	}

	public test(value: unknown, path: string = "value"): value is T {
		try {
			this.assert(value, path);

			return true;
		} catch (e) {
			return false;
		}
	}
}