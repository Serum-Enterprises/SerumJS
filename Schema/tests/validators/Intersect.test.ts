import {Domain, Validator, IntersectValidator, AssertError, DefinitionError} from '../../src';

class MockObjectValidator extends Validator<object> {
	public static fromJSON() {
		return new MockObjectValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is object {
		if (typeof data !== 'object' || data === null)
			throw new AssertError(`Expected object at ${path}`, path);
	}

	public clone(): this {
		return new MockObjectValidator() as this;
	}

	public toJSON() {
		return {type: 'object'};
	}
}

class MockHasAValidator extends Validator<{ a: unknown }> {
	public static fromJSON() {
		return new MockHasAValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is { a: unknown } {
		if (typeof data !== 'object' || data === null || !('a' in data))
			throw new AssertError(`Expected to have property a at ${path}`, path);
	}

	public clone(): this {
		return new MockHasAValidator() as this;
	}

	public toJSON() {
		return {type: 'hasA'};
	}
}

const registry = {
	core: {
		validators: {
			Object: MockObjectValidator as any,
			HasA: MockHasAValidator as any
		}
	}
};
const Schema = Domain.create(registry, []);

describe('Testing Intersect Validator', () => {
	test('Testing assert', () => {
		const objV = new MockObjectValidator();
		const hasAV = new MockHasAValidator();
		const intersect = Schema.Intersect.variants([objV, hasAV]);

		expect(() => intersect.assert({a: 1})).not.toThrow();
		expect(() => intersect.assert({})).toThrow(AssertError);
		expect(() => intersect.assert({})).toThrow(/Expected to match all Intersect Variants/);
		expect(() => intersect.assert(123)).toThrow(AssertError);
	});

	test('Testing empty variants assert', () => {
		const intersect = Schema.Intersect;
		expect(() => intersect.assert('anything')).toThrow(AssertError);
		expect(() => intersect.assert('anything')).toThrow(/Expected at least one Variant/);
	});

	test('Testing non-array variants in fromJSON', () => {
		expect(() => IntersectValidator.fromJSON({
			type: 'intersect',
			variants: 'invalid'
		}, 'def', Schema)).toThrow(DefinitionError);
	});

	test('Testing toJSON', () => {
		const objV = new MockObjectValidator();
		const intersect = Schema.Intersect.variants([objV]);
		expect(intersect.toJSON()).toEqual({
			type: 'intersect',
			variants: [{type: 'object'}]
		});
	});

	test('Testing clone', () => {
		const objV = new MockObjectValidator();
		const intersect = Schema.Intersect.variants([objV]);
		const cloned = intersect.clone();
		expect(cloned).toBeInstanceOf(IntersectValidator);
		expect(cloned.rules.variants[0]).not.toBe(intersect.rules.variants[0]);
		expect(cloned.rules.variants[0]).toBeInstanceOf(MockObjectValidator);
	});

	test('Testing fromJSON', () => {
		const definition = {
			type: 'intersect',
			variants: [{type: 'core.object'}, {type: 'core.hasa'}]
		};
		const intersect = Schema.fromJSON(definition) as IntersectValidator;
		expect(intersect.rules.variants.length).toBe(2);
		expect(intersect.rules.variants[0]).toBeInstanceOf(MockObjectValidator);
		expect(intersect.rules.variants[1]).toBeInstanceOf(MockHasAValidator);

		expect(IntersectValidator.fromJSON({
			type: 'intersect',
			variants: [{type: 'core.object'}]
		}, undefined, Schema)).toBeInstanceOf(IntersectValidator);

		expect(() => IntersectValidator.fromJSON({type: 'intersect'}, 'def', Schema)).toThrow(DefinitionError);
	});
});
