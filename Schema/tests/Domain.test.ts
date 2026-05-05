import {
	Domain,
	Validator,
	NeverValidator,
	UnknownValidator,
	UnionValidator,
	IntersectValidator,
	DefinitionError,
	DomainError
} from '../src';

class MockValidator extends Validator {
	public static fromJSON() {
		return new MockValidator();
	}

	public assert() {}

	public clone(): this {
		return new MockValidator() as this;
	}

	public toJSON() {
		return {type: 'test.mock'};
	}
}

describe('Testing Domain', () => {
	test('Testing static create', () => {
		expect(Domain.create({}, [])).toBeDefined();

		const registry = {
			test: {
				validators: {
					Mock: MockValidator as any
				}
			}
		};
		const domain = Domain.create(registry, []);
		expect(domain).toBeDefined();
		expect((domain as any).test).toBeDefined();
	});

	test('Testing invalid registry identifiers', () => {
		expect(() => Domain.create({
			'': {validators: {}}
		}, [])).toThrow(DomainError);

		expect(() => Domain.create({
			'normalize': {validators: {}}
		}, [])).toThrow(DomainError);
	});

	test('Testing invalid validator identifiers', () => {
		expect(() => Domain.create({
			test: {validators: {'': MockValidator as any}}
		}, [])).toThrow(DomainError);
	});

	test('Testing duplicate validator identifiers', () => {
		expect(() => Domain.create({
			test: {
				validators: {
					Mock: MockValidator as any,
					MOCK: MockValidator as any
				}
			}
		}, [])).toThrow(DomainError);

		expect(() => Domain.create({
			test: {validators: {Mock: MockValidator as any}},
			TEST: {validators: {MOCK: MockValidator as any}}
		}, [])).toThrow(DomainError);
	});

	test('Testing built-in getters', () => {
		const domain = Domain.create({}, []);
		expect(domain.Never).toBeInstanceOf(NeverValidator);
		expect(domain.Unknown).toBeInstanceOf(UnknownValidator);
		expect(domain.Union).toBeInstanceOf(UnionValidator);
		expect(domain.Intersect).toBeInstanceOf(IntersectValidator);
	});

	test('Testing fromJSON', () => {
		const domain = Domain.create({
			test: {validators: {Mock: MockValidator as any}}
		}, []);

		expect(domain.fromJSON({type: 'never'})).toBeInstanceOf(NeverValidator);
		expect(domain.fromJSON({type: 'unknown'})).toBeInstanceOf(UnknownValidator);
		expect(domain.fromJSON({type: 'union', variants: []})).toBeInstanceOf(UnionValidator);
		expect(domain.fromJSON({type: 'intersect', variants: []})).toBeInstanceOf(IntersectValidator);
		expect(domain.fromJSON({type: 'test.mock'})).toBeInstanceOf(MockValidator);

		expect(() => domain.fromJSON('invalid')).toThrow(DefinitionError);
		expect(() => domain.fromJSON({type: 123})).toThrow(DefinitionError);
		expect(() => domain.fromJSON({type: 'nonexistent'})).toThrow(DefinitionError);
		expect(() => domain.fromJSON({})).toThrow(DefinitionError);
	});

	test('Testing Operations proxies', () => {
		// Since we don't have full Operations implementation here, we just check they are called
		const domain = Domain.create({}, []);
		const v = domain.Unknown;

		// These might throw or return based on Operations.merge([]) default behavior
		// Let's just ensure the methods exist and don't crash the domain
		expect(domain.normalize(v)).toBeDefined();
		expect(domain.isEqual(v, v)).toBe(true);
		expect(domain.isSubset(v, v)).toBe(true);
		expect(domain.merge(v, v)).toBeDefined();
	});
});
