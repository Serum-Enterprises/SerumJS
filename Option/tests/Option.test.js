const { Option } = require('../build/Option');

describe('Testing Option.js', () => {
	test('Testing Option.Some', () => {
		const value = 42;
		const option = Option.Some(value);

		expect(option.isSome()).toBe(true);
		expect(option.isNone()).toBe(false);
		expect(option.value).toBe(value);
	});

	test('Testing Option.None', () => {
		const option = Option.None();

		expect(option.isSome()).toBe(false);
		expect(option.isNone()).toBe(true);
	});

	test('Testing Option.onSome', () => {
		const value = 42;
		const mockFn = jest.fn();
		const someOption = Option.Some(value);
		const noneOption = Option.None();

		someOption.onSome(mockFn);

		expect(mockFn).toHaveBeenCalledTimes(1);
		expect(mockFn).toHaveBeenCalledWith(value);

		mockFn.mockClear();

		noneOption.onSome(mockFn);

		expect(mockFn).toHaveBeenCalledTimes(0);
	});

	test('Testing Option.onNone', () => {
		const value = 42;
		const mockFn = jest.fn();
		const someOption = Option.Some(value);
		const noneOption = Option.None();

		noneOption.onNone(mockFn);

		expect(mockFn).toHaveBeenCalledTimes(1);

		mockFn.mockClear();

		someOption.onNone(mockFn);

		expect(mockFn).toHaveBeenCalledTimes(0);
	});

	test('Testing Option.map', () => {
		const value = 42;
		const option = Option.Some(value);
		const newOption = option.map(v => v * 2);

		expect(newOption.isSome()).toBe(true);
		expect(newOption).toHaveProperty('value', 84);
	});

	test('Testing Option.map with None', () => {
		const option = Option.None();
		const newOption = option.map(v => v * 2);

		expect(newOption.isNone()).toBe(true);
	});

	test('Testing Option.match with Some', () => {
		const value = 42;
		const option = Option.Some(value);

		const outcome = option.match(
			v => `Value is ${v}`,
			() => 'No value'
		);

		expect(outcome).toBe('Value is 42');
	});

	test('Testing Option.match with None', () => {
		const option = Option.None();

		const outcome = option.match(
			v => `Value is ${v}`,
			() => 'No value'
		);

		expect(outcome).toBe('No value');
	});
});
