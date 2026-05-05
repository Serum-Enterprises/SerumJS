import {Validator, AssertError} from '../src';

class MockValidator extends Validator<string> {
	public assert(data: unknown, path: string = 'data'): asserts data is string {
		if (typeof data !== 'string') {
			throw new AssertError(`Expected string at ${path}`, path);
		}
	}

	public clone(): this {
		return new MockValidator() as this;
	}

	public toJSON() {
		return {type: 'mock'};
	}
}

describe('Testing Validator Base Class', () => {
	test('Testing validate method', () => {
		const validator = new MockValidator();

		expect(validator.validate('Hello World')).toBe('Hello World');
		expect(() => validator.validate(1)).toThrow(AssertError);
		expect(() => validator.validate(1, 'customPath')).toThrow(/customPath/);
	});

	test('Testing test method', () => {
		const validator = new MockValidator();

		expect(validator.test('Hello World')).toBe(true);
		expect(validator.test(1)).toBe(false);
		expect(validator.test(1, 'customPath')).toBe(false);
	});
});
