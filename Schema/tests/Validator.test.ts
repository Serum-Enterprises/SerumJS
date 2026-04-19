import {SchemaDomain} from '../src';

const Schema = SchemaDomain.create();

describe('Testing Validator Base Class', () => {
	test('Testing validate method', () => {
		const validator = Schema.String;

		expect(validator.validate('Hello World')).toBe('Hello World');
		expect(() => validator.validate(1)).toThrow();
	});

	test('Testing test method', () => {
		const validator = Schema.String;

		expect(validator.test('Hello World')).toBe(true);
		expect(validator.test(1)).toBe(false);
	});
});
