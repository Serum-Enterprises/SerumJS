import {SchemaDomain, AssertError, StringValidator, DefinitionError} from '../../src';

const Schema = SchemaDomain.create();

describe('Testing String Validator', () => {
	test('Testing assert', () => {
		expect(() => Schema.String.assert("Hello World")).not.toThrow();

		expect(() => Schema.String.assert(null)).toThrow(AssertError);
		expect(() => Schema.String.assert(true)).toThrow(AssertError);
		expect(() => Schema.String.assert(1)).toThrow(AssertError);

		expect(() => Schema.String.min(5).assert("Hello World")).not.toThrow();
		expect(() => Schema.String.min(5).assert("Hi")).toThrow(AssertError);

		expect(() => Schema.String.max(5).assert("Hi")).not.toThrow();
		expect(() => Schema.String.max(5).assert("Hello World")).toThrow(AssertError);

		expect(() => Schema.String.equals("Hello World").assert("Hello World")).not.toThrow();
		expect(() => Schema.String.equals("Hello World").assert("Hi")).toThrow(AssertError);
	});

	test('Testing min', () => {
		expect(Schema.String.min(5)).toBeInstanceOf(StringValidator);
	});

	test('Testing max', () => {
		expect(Schema.String.max(5)).toBeInstanceOf(StringValidator);
	});

	test('Testing equals', () => {
		expect(Schema.String.equals("Hello World")).toBeInstanceOf(StringValidator);
	});

	test('Testing toJSON', () => {
		expect(Schema.String.toJSON()).toEqual({type: 'string'});
		expect(Schema.String.min(1).toJSON()).toEqual({type: 'string', min: 1});
		expect(Schema.String.max(1).toJSON()).toEqual({type: 'string', max: 1});
		expect(Schema.String.equals("Hello World").toJSON()).toEqual({type: 'string', equals: "Hello World"});
		expect(Schema.String.min(1).max(10).equals("Hello").toJSON())
			.toEqual({type: 'string', min: 1, max: 10, equals: "Hello"});
	});

	test('Testing fromJSON', () => {
		expect(StringValidator.fromJSON({type: 'string'}, undefined, Schema)).toBeInstanceOf(StringValidator);
		expect(Schema.fromJSON({type: 'string'})).toBeInstanceOf(StringValidator);
		expect(Schema.fromJSON({type: 'string', min: 1})).toBeInstanceOf(StringValidator);
		expect(() => Schema.fromJSON({type: 'string', min: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'string', max: 1})).toBeInstanceOf(StringValidator);
		expect(() => Schema.fromJSON({type: 'string', max: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'string', equals: "Hello World"})).toBeInstanceOf(StringValidator);
		expect(() => Schema.fromJSON({type: 'string', equals: 1})).toThrow(DefinitionError);
	});
});
