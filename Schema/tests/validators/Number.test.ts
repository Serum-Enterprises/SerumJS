import {SchemaDomain, AssertError, NumberValidator, DefinitionError} from '../../src';

const Schema = SchemaDomain.create();

describe('Testing Number Validator', () => {
	test('Testing assert', () => {
		expect(() => Schema.Number.assert(1)).not.toThrow();
		expect(() => Schema.Number.assert(1.5)).not.toThrow();

		expect(() => Schema.Number.assert(null)).toThrow(AssertError);
		expect(() => Schema.Number.assert(NaN)).toThrow(AssertError);
		expect(() => Schema.Number.assert('Hello World')).toThrow(AssertError);

		expect(() => Schema.Number.integer().assert(1)).not.toThrow();
		expect(() => Schema.Number.integer().assert(1.5)).toThrow(AssertError);

		expect(() => Schema.Number.min(0).assert(1)).not.toThrow();
		expect(() => Schema.Number.min(0).assert(-1)).toThrow(AssertError);

		expect(() => Schema.Number.max(10).assert(1)).not.toThrow();
		expect(() => Schema.Number.max(10).assert(100)).toThrow(AssertError);

		expect(() => Schema.Number.equals(1).assert(1)).not.toThrow();
		expect(() => Schema.Number.equals(1).assert(1.5)).toThrow(AssertError);
	});

	test('Testing integer', () => {
		expect(Schema.Number.integer()).toBeInstanceOf(NumberValidator);
		expect(Schema.Number.integer(true)).toBeInstanceOf(NumberValidator);
		expect(Schema.Number.integer(false)).toBeInstanceOf(NumberValidator);
	});

	test('Testing min', () => {
		expect(Schema.Number.min(1)).toBeInstanceOf(NumberValidator);
	});

	test('Testing max', () => {
		expect(Schema.Number.max(1)).toBeInstanceOf(NumberValidator);
	});

	test('Testing equals', () => {
		expect(Schema.Number.equals(1)).toBeInstanceOf(NumberValidator);
	});

	test('Testing toJSON', () => {
		expect(Schema.Number.toJSON()).toEqual({type: 'number'});
		expect(Schema.Number.integer().toJSON()).toEqual({type: 'number', integer: true});
		expect(Schema.Number.min(1).toJSON()).toEqual({type: 'number', min: 1});
		expect(Schema.Number.max(1).toJSON()).toEqual({type: 'number', max: 1});
		expect(Schema.Number.equals(1).toJSON()).toEqual({type: 'number', equals: 1});
		expect(Schema.Number.integer().min(1).max(10).equals(5).toJSON())
			.toEqual({type: 'number', integer: true, min: 1, max: 10, equals: 5});
	});

	test('Testing fromJSON', () => {
		expect(Schema.fromJSON({type: 'number'})).toBeInstanceOf(NumberValidator);
		expect(Schema.fromJSON({type: 'number', integer: true})).toBeInstanceOf(NumberValidator);
		expect(Schema.fromJSON({type: 'number', integer: false})).toBeInstanceOf(NumberValidator);
		expect(() => Schema.fromJSON({type: 'number', integer: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'number', min: 1})).toBeInstanceOf(NumberValidator);
		expect(() => Schema.fromJSON({type: 'number', min: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'number', max: 1})).toBeInstanceOf(NumberValidator);
		expect(() => Schema.fromJSON({type: 'number', max: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'number', equals: 1})).toBeInstanceOf(NumberValidator);
		expect(() => Schema.fromJSON({type: 'number', equals: 'Hello World'})).toThrow(DefinitionError);
	});
});
