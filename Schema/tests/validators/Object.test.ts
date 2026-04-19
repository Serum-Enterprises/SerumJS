import {SchemaDomain, AssertError, ObjectValidator, DefinitionError} from '../../src';

const Schema = SchemaDomain.create();
const BadValidator = {
	assert: () => { throw "Not an Error instance"; }
} as any;
const BadSchemaDomain = {
	fromJSON: () => {throw "Not an Error instance";}
} as any;

describe('Testing Object Validator', () => {
	test('Testing assert', () => {
		expect(() => Schema.Object.assert({})).not.toThrow();
		expect(() => Schema.Object.assert({a: 1, b: 2})).not.toThrow();

		expect(() => Schema.Object.assert(null)).toThrow(AssertError);
		expect(() => Schema.Object.assert(NaN)).toThrow(AssertError);
		expect(() => Schema.Object.assert('Hello World')).toThrow(AssertError);
		expect(() => Schema.Object.assert([1, 2, 3])).toThrow(AssertError);

		expect(() => Schema.Object.min(2).assert({a: 1, b: 2})).not.toThrow();
		expect(() => Schema.Object.min(2).assert({a: 1})).toThrow(AssertError);

		expect(() => Schema.Object.max(1).assert({a: 1})).not.toThrow();
		expect(() => Schema.Object.max(1).assert({a: 1, b: 2})).toThrow(AssertError);

		expect(() => Schema.Object.every(Schema.Number).assert({a: 1, b: 2})).not.toThrow();
		expect(() => Schema.Object.every(Schema.Number).assert({a: 1, b: true})).toThrow(AggregateError);
		expect(() => Schema.Object.every(BadValidator).assert({a: 1, b: 2})).toThrow(Error);

		expect(() => Schema.Object.shape({
			a: Schema.Boolean,
			b: Schema.Number
		}).assert({a: true, b: 2})).not.toThrow();
		expect(() => Schema.Object.shape({
			a: Schema.Boolean,
			b: Schema.Number
		}).assert({a: true, b: 2, c: 5})).not.toThrow();
		expect(() => Schema.Object.shape({
			a: Schema.Boolean,
			b: Schema.Number
		}).assert({a: 1, b: 2, c: 5})).toThrow(AggregateError);
		expect(() => Schema.Object.shape({a: BadValidator}).assert({a: 1, b: 2})).toThrow(Error);

		expect(() => Schema.Object.exact().shape({
			a: Schema.Boolean,
			b: Schema.Number
		}).assert({a: true, b: 2})).not.toThrow();
		expect(() => Schema.Object.exact().shape({
			a: Schema.Boolean,
			b: Schema.Number
		}).assert({a: true, b: 2, c: 5})).toThrow();
	});

	test('Testing min', () => {
		expect(Schema.Object.min(1)).toBeInstanceOf(ObjectValidator);
	});

	test('Testing max', () => {
		expect(Schema.Object.max(1)).toBeInstanceOf(ObjectValidator);
	});

	test('Testing every', () => {
		expect(Schema.Object.every(Schema.Number)).toBeInstanceOf(ObjectValidator);
	});

	test('Testing shape', () => {
		expect(Schema.Object.shape({a: Schema.Boolean, b: Schema.Number})).toBeInstanceOf(ObjectValidator);
	});

	test('Testing exact', () => {
		expect(Schema.Object.exact()).toBeInstanceOf(ObjectValidator);
		expect(Schema.Object.exact(true)).toBeInstanceOf(ObjectValidator);
		expect(Schema.Object.exact(false)).toBeInstanceOf(ObjectValidator);
	});

	test('Testing toJSON', () => {
		expect(Schema.Object.toJSON()).toEqual({type: 'object'});
		expect(Schema.Object.min(1).toJSON()).toEqual({type: 'object', min: 1});
		expect(Schema.Object.max(1).toJSON()).toEqual({type: 'object', max: 1});
		expect(Schema.Object.every(Schema.Number).toJSON()).toEqual({type: 'object', every: {type: 'number'}});
		expect(Schema.Object.shape({a: Schema.Boolean, b: Schema.Number}).toJSON())
			.toEqual({type: 'object', shape: {a: {type: 'boolean'}, b: {type: 'number'}}});
		expect(Schema.Object.exact().toJSON()).toEqual({type: 'object', exact: true});
	});

	test('Testing fromJSON', () => {
		expect(ObjectValidator.fromJSON({type: 'object'}, undefined, Schema)).toBeInstanceOf(ObjectValidator);
		expect(Schema.fromJSON({type: 'object'})).toBeInstanceOf(ObjectValidator);
		expect(Schema.fromJSON({type: 'object', min: 1})).toBeInstanceOf(ObjectValidator);
		expect(() => Schema.fromJSON({type: 'object', min: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'object', max: 1})).toBeInstanceOf(ObjectValidator);
		expect(() => Schema.fromJSON({type: 'object', max: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'object', every: {type: 'number'}})).toBeInstanceOf(ObjectValidator);
		expect(() => Schema.fromJSON({type: 'object', every: 'Hello World'})).toThrow(DefinitionError);
		expect(Schema.fromJSON({
			type: 'object',
			shape: {a: {type: 'boolean'}, b: {type: 'number'}}
		})).toBeInstanceOf(ObjectValidator);
		expect(() => Schema.fromJSON({type: 'object', shape: 'Hello World'})).toThrow(DefinitionError);
		expect(() => Schema.fromJSON({type: 'object', shape: {a: 1, b: 2}})).toThrow(AggregateError);
		expect(() => ObjectValidator.fromJSON({
			type: 'object',
			shape: {a: {type: 'any'}}
		}, 'definition', BadSchemaDomain)).toThrow(AggregateError)
		expect(Schema.fromJSON({type: 'object', exact: false})).toBeInstanceOf(ObjectValidator);
		expect(Schema.fromJSON({type: 'object', exact: true})).toBeInstanceOf(ObjectValidator);
		expect(() => Schema.fromJSON({type: 'object', exact: 'Hello World'})).toThrow(DefinitionError);
	});
});
