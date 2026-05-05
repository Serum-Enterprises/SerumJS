import {Domain, UnknownValidator} from '../../src';

const Schema = Domain.create({}, []);

describe('Testing Unknown Validator', () => {
	test('Testing assert', () => {
		const validator = Schema.Unknown;

		// Should not throw for anything
		expect(() => validator.assert(undefined)).not.toThrow();
		expect(() => validator.assert(null)).not.toThrow();
		expect(() => validator.assert(true)).not.toThrow();
		expect(() => validator.assert(1.5)).not.toThrow();
		expect(() => validator.assert('Hello World')).not.toThrow();
		expect(() => validator.assert([1, 2, 3])).not.toThrow();
		expect(() => validator.assert({a: 1, b: 2})).not.toThrow();
	});

	test('Testing toJSON', () => {
		expect(Schema.Unknown.toJSON()).toEqual({type: 'unknown'});
	});

	test('Testing clone', () => {
		const validator = Schema.Unknown;

		expect(validator.clone()).toBeInstanceOf(UnknownValidator);
		expect(validator.clone() === validator).toBe(false);
	});

	test('Testing fromJSON', () => {
		expect(UnknownValidator.fromJSON({type: 'unknown'}, undefined, Schema)).toBeInstanceOf(UnknownValidator);
		expect(Schema.fromJSON({type: 'unknown'})).toBeInstanceOf(UnknownValidator);
	});
});
