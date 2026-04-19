import {SchemaDomain, AssertError, BooleanValidator, DefinitionError} from '../../src';

const Schema = SchemaDomain.create();

describe('Testing Boolean Validator', () => {
	test('Testing assert', () => {
		expect(() => Schema.Boolean.assert(true)).not.toThrow();
		expect(() => Schema.Boolean.assert(false)).not.toThrow();

		expect(() => Schema.Boolean.assert(null)).toThrow(AssertError);
		expect(() => Schema.Boolean.assert(1)).toThrow(AssertError);
		expect(() => Schema.Boolean.assert('Hello World')).toThrow(AssertError);

		expect(() => Schema.Boolean.equals(true).assert(true)).not.toThrow();
		expect(() => Schema.Boolean.equals(false).assert(true)).toThrow(AssertError);
	});

	test('Testing equals', () => {
		expect(Schema.Boolean.equals(true)).toBeInstanceOf(BooleanValidator)
	})

	test('Testing toJSON', () => {
		expect(Schema.Boolean.toJSON()).toEqual({type: 'boolean'});
		expect(Schema.Boolean.equals(true).toJSON()).toEqual({type: 'boolean', equals: true});
	})

	test('Testing fromJSON', () => {
		expect(Schema.fromJSON({type: 'boolean'})).toBeInstanceOf(BooleanValidator);
		expect(Schema.fromJSON({type: 'boolean', equals: true})).toBeInstanceOf(BooleanValidator);
		expect(() => Schema.fromJSON({type: 'boolean', equals: 'Hello World'})).toThrow(DefinitionError);
	});
});
