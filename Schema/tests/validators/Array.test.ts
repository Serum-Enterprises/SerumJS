import {SchemaDomain, AssertError, ArrayValidator, DefinitionError} from '../../src';

const Schema = SchemaDomain.create();
const BadValidator = {
	assert: () => { throw "Not an Error instance"; }
} as any;
const BadSchemaDomain = {
	fromJSON: () => {throw "Not an Error instance";}
} as any;

describe('Testing Array Validator', () => {
	test('Testing assert', () => {
		expect(() => Schema.Array.assert([])).not.toThrow();
		expect(() => Schema.Array.assert([1, 2, 3])).not.toThrow();

		expect(() => Schema.Array.assert(null)).toThrow(AssertError);
		expect(() => Schema.Array.assert(NaN)).toThrow(AssertError);
		expect(() => Schema.Array.assert('Hello World')).toThrow(AssertError);
		expect(() => Schema.Array.assert({a: 1, b: 2})).toThrow(AssertError);

		expect(() => Schema.Array.min(2).assert([1, 2, 3])).not.toThrow();
		expect(() => Schema.Array.min(2).assert([1])).toThrow(AssertError);

		expect(() => Schema.Array.max(2).assert([1])).not.toThrow();
		expect(() => Schema.Array.max(2).assert([1, 2, 3])).toThrow(AssertError);

		expect(() => Schema.Array.every(Schema.Number).assert([1, 2, 3])).not.toThrow();
		expect(() => Schema.Array.every(Schema.Number).assert([true, false])).toThrow(AggregateError);
		expect(() => Schema.Array.every(BadValidator).assert([1, 2, 3])).toThrow(Error);

		expect(() => Schema.Array.tuple([Schema.Boolean, Schema.Number]).assert([true, 1])).not.toThrow();
		expect(() => Schema.Array.tuple([Schema.Boolean, Schema.Number]).assert([1, true])).toThrow();
		expect(() => Schema.Array.tuple([Schema.Boolean]).assert([true, 1, 2])).not.toThrow();
		expect(() => Schema.Array.tuple([Schema.Boolean]).assert([1, 2, 3])).toThrow();
		expect(() => Schema.Array.tuple([Schema.Boolean, Schema.Number]).assert([true])).toThrow();
		expect(() => Schema.Array.tuple([BadValidator]).assert([1, 2, 3])).toThrow(Error);
	});

	test('Testing min', () => {
		expect(Schema.Array.min(1)).toBeInstanceOf(ArrayValidator);
	});

	test('Testing max', () => {
		expect(Schema.Array.max(1)).toBeInstanceOf(ArrayValidator);
	});

	test('Testing every', () => {
		expect(Schema.Array.every(Schema.Number)).toBeInstanceOf(ArrayValidator);
	});

	test('Testing tuple', () => {
		expect(Schema.Array.tuple([Schema.Boolean, Schema.Number])).toBeInstanceOf(ArrayValidator);
	});

	test('Testing toJSON', () => {
		expect(Schema.Array.toJSON()).toEqual({type: 'array'});
		expect(Schema.Array.min(1).toJSON()).toEqual({type: 'array', min: 1});
		expect(Schema.Array.max(1).toJSON()).toEqual({type: 'array', max: 1});
		expect(Schema.Array.every(Schema.Number).toJSON()).toEqual({type: 'array', every: {type: 'number'}});
		expect(Schema.Array.tuple([Schema.Boolean, Schema.Number]).toJSON())
			.toEqual({type: 'array', tuple: [{type: 'boolean'}, {type: 'number'}]});
	});

	test('Testing fromJSON', () => {
		expect(ArrayValidator.fromJSON({type: 'array'}, undefined, Schema)).toBeInstanceOf(ArrayValidator);
		expect(Schema.fromJSON({type: 'array'})).toBeInstanceOf(ArrayValidator);
		expect(Schema.fromJSON({type: 'array', min: 1})).toBeInstanceOf(ArrayValidator);
		expect(() => Schema.fromJSON({type: 'array', min: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'array', max: 1})).toBeInstanceOf(ArrayValidator);
		expect(() => Schema.fromJSON({type: 'array', max: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'array', every: {type: 'number'}})).toBeInstanceOf(ArrayValidator);
		expect(() => Schema.fromJSON({type: 'array', every: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'array', tuple: [{type: 'boolean'}, {type: 'number'}]})).toBeInstanceOf(ArrayValidator);
		expect(() => Schema.fromJSON({type: 'array', tuple: 'Hello World'})).toThrow(DefinitionError);
		expect(() => Schema.fromJSON({type: 'array', tuple: [1, 2, 3]})).toThrow(AggregateError);
		expect(() => ArrayValidator.fromJSON({
			type: 'array',
			tuple: [{type: 'any'}]
		}, 'definition', BadSchemaDomain)).toThrow(AggregateError);
	});
});
