import {Domain, Validator, UnionValidator, AssertError, DefinitionError} from '../../src';

class MockStringValidator extends Validator<string> {
	public static fromJSON() {
		return new MockStringValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is string {
		if (typeof data !== 'string')
			throw new AssertError(`Expected string at ${path}`, path);
	}

	public clone(): this {
		return new MockStringValidator() as this;
	}

	public toJSON() {
		return {type: 'string'};
	}
}

class MockNumberValidator extends Validator<number> {
	public static fromJSON() {
		return new MockNumberValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is number {
		if (typeof data !== 'number')
			throw new AssertError(`Expected number at ${path}`, path);
	}

	public clone(): this {
		return new MockNumberValidator() as this;
	}

	public toJSON() {
		return {type: 'number'};
	}
}

const registry = {
	core: {
		validators: {
			String: MockStringValidator as any,
			Number: MockNumberValidator as any
		}
	}
};
const Schema = Domain.create(registry, []);

describe('Testing Union Validator', () => {
	test('Testing assert', () => {
		const stringV = new MockStringValidator();
		const numberV = new MockNumberValidator();
		const union = Schema.Union.variants([stringV, numberV]);

		expect(() => union.assert('hello')).not.toThrow();
		expect(() => union.assert(123)).not.toThrow();
		expect(() => union.assert(true)).toThrow(AssertError);
		expect(() => union.assert(true)).toThrow(/Expected to match at least one Union Variant/);
	});

	test('Testing empty variants assert', () => {
		const union = Schema.Union;
		expect(() => union.assert('anything')).toThrow(AssertError);
		expect(() => union.assert('anything')).toThrow(/Expected at least one Variant/);
	});

	test('Testing non-array variants in fromJSON', () => {
		expect(() => UnionValidator.fromJSON({
			type: 'union',
			variants: 'invalid'
		}, 'def', Schema)).toThrow(DefinitionError);
	});

	test('Testing toJSON', () => {
		const stringV = new MockStringValidator();
		const union = Schema.Union.variants([stringV]);
		expect(union.toJSON()).toEqual({
			type: 'union',
			variants: [{type: 'string'}]
		});
	});

	test('Testing clone', () => {
		const stringV = new MockStringValidator();
		const union = Schema.Union.variants([stringV]);
		const cloned = union.clone();
		expect(cloned).toBeInstanceOf(UnionValidator);
		expect(cloned.rules.variants[0]).not.toBe(union.rules.variants[0]);
		expect(cloned.rules.variants[0]).toBeInstanceOf(MockStringValidator);
	});

	test('Testing fromJSON', () => {
		const definition = {
			type: 'union',
			variants: [{type: 'core.string'}, {type: 'core.number'}]
		};
		const union = Schema.fromJSON(definition) as UnionValidator;
		expect(union.rules.variants.length).toBe(2);
		expect(union.rules.variants[0]).toBeInstanceOf(MockStringValidator);
		expect(union.rules.variants[1]).toBeInstanceOf(MockNumberValidator);

		expect(UnionValidator.fromJSON({
			type: 'union',
			variants: [{type: 'core.string'}]
		}, undefined, Schema)).toBeInstanceOf(UnionValidator);

		expect(() => UnionValidator.fromJSON({type: 'union'}, 'def', Schema)).toThrow(DefinitionError);
	});
});
