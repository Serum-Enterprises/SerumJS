import {Domain, NeverValidator, AssertError} from '../../src';

const Schema = Domain.create({}, []);

describe('Testing Never Validator', () => {
	test('Testing assert', () => {
		const validator = Schema.Never;

		expect(() => validator.assert(undefined)).toThrow(AssertError);
		expect(() => validator.assert(null)).toThrow(AssertError);
		expect(() => validator.assert(true)).toThrow(AssertError);
		expect(() => validator.assert(1.5)).toThrow(AssertError);
		expect(() => validator.assert('Hello World')).toThrow(AssertError);
		expect(() => validator.assert([1, 2, 3])).toThrow(AssertError);
		expect(() => validator.assert({a: 1, b: 2})).toThrow(AssertError);
	});

	test('Testing toJSON', () => {
		expect(Schema.Never.toJSON()).toEqual({type: 'never'});
	});

	test('Testing clone', () => {
		const validator = Schema.Never;

		expect(validator.clone()).toBeInstanceOf(NeverValidator);
		expect(validator.clone() === validator).toBe(false);
	});

	test('Testing isEqual', () => {
		expect(Schema.isEqual(Schema.Never, Schema.Never)).toBe(true);
		expect(Schema.isEqual(Schema.Never, Schema.Unknown)).toBe(false);
	});

	test('Testing merge', () => {
		expect(Schema.merge(Schema.Never, Schema.Never)).toBeInstanceOf(NeverValidator);
		// Note: behavior with other validators depends on Operations
	});

	test('Testing normalize', () => {
		const validator = Schema.Never;

		expect(Schema.normalize(validator)).toBeInstanceOf(NeverValidator);
	});

	test('Testing fromJSON', () => {
		expect(NeverValidator.fromJSON({type: 'never'}, undefined, Schema)).toBeInstanceOf(NeverValidator);
		expect(Schema.fromJSON({type: 'never'})).toBeInstanceOf(NeverValidator);
		expect(Schema.fromJSON({type: 'never'}, 'customPath')).toBeInstanceOf(NeverValidator);
	});
});
