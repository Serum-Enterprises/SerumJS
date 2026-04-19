import {SchemaDomain, AssertError, JSONValidator} from '../../src';

const Schema = SchemaDomain.create();

describe('Testing JSON Validator', () => {
	test('Testing assert', () => {
		const validator = Schema.JSON;

		expect(() => validator.assert(null)).not.toThrow();
		expect(() => validator.assert(1)).not.toThrow();
		expect(() => validator.assert('string')).not.toThrow();
		expect(() => validator.assert(true)).not.toThrow();
		expect(() => validator.assert([])).not.toThrow();
		expect(() => validator.assert({})).not.toThrow();
		expect(() => validator.assert(undefined)).toThrow(AssertError);
	});

	test('Testing toJSON', () => {
		expect(Schema.JSON.toJSON()).toEqual({type: 'json'});
	});

	test('Testing fromJSON', () => {
		expect(Schema.fromJSON({type: 'json'})).toBeInstanceOf(JSONValidator);
		expect(Schema.fromJSON({type: 'json'}, 'customPath')).toBeInstanceOf(JSONValidator);
	});
});
