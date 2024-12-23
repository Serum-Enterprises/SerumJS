const { Result } = require('../build/Result');

describe('Testing Result.js', () => {
	test('Testing Result.Ok', () => {
		const value = 42;
		const result = Result.Ok(value);

		expect(result.isOk()).toBe(true);
		expect(result.isErr()).toBe(false);
		expect(result.value).toBe(value);
	});

	test('Testing Result.Err', () => {
		const error = 'Error message';
		const result = Result.Err(error);

		expect(result.isOk()).toBe(false);
		expect(result.isErr()).toBe(true);
		expect(result.error).toBe(error);
	});

	test('Testing Result.onOk', () => {
		const value = 42;
		const mockFn = jest.fn();
		const result = Result.Ok(value);

		result.onOk(mockFn);

		expect(mockFn).toHaveBeenCalledWith(value);
	});

	test('Testing Result.onErr', () => {
		const error = 'Error message';
		const mockFn = jest.fn();
		const result = Result.Err(error);

		result.onErr(mockFn);

		expect(mockFn).toHaveBeenCalledWith(error);
	});

	test('Testing Result.mapOk', () => {
		const value = 42;
		const result = Result.Ok(value);
		const newResult = result.mapOk(v => v * 2);

		expect(newResult.isOk()).toBe(true);
		expect(newResult).toHaveProperty('value', 84);
	});

	test('Testing Result.mapErr', () => {
		const error = 'Error message';
		const result = Result.Err(error);
		const newResult = result.mapErr(e => `${e}!`);

		expect(newResult.isErr()).toBe(true);
		expect(newResult).toHaveProperty('error', 'Error message!');
	});

	test('Testing Result.match', () => {
		const value = 42;
		const result = Result.Ok(value);

		const outcome = result.match(
			v => `Value is ${v}`,
			e => `Error is ${e}`
		);

		expect(outcome).toBe('Value is 42');
	});

	test('Testing Result.match', () => {
		const error = 'Error message';
		const result = Result.Err(error);

		const outcome = result.match(
			v => `Value is ${v}`,
			e => `Error is ${e}`
		);

		expect(outcome).toBe('Error is Error message');
	});
});
