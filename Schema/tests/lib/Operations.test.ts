import {Operations} from '../../src/lib/Operations';
import {NeverValidator, UnknownValidator, UnionValidator, IntersectValidator, Validator, AssertError} from '../../src';
import {MergeError, DomainError} from "../../src/lib/errors";

class MockValidator extends Validator<string> {
	public static fromJSON() {
		return new MockValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is string {
		if (typeof data !== 'string')
			throw new AssertError('Expected string', path);
	}

	public clone(): this {
		return new MockValidator() as this;
	}

	public toJSON() {
		return {type: 'mock'};
	}
}

class OtherValidator extends Validator<number> {
	public static fromJSON() {
		return new OtherValidator();
	}

	public assert(data: unknown, path: string = 'data'): asserts data is number {
		if (typeof data !== 'number')
			throw new AssertError('Expected number', path);
	}

	public clone(): this {
		return new OtherValidator() as this;
	}

	public toJSON() {
		return {type: 'other'};
	}
}

describe('Testing Operations', () => {
	const ops = Operations.merge([]);

	test('Testing normalize', () => {
		const unknown = new UnknownValidator();
		expect(ops.normalize(unknown)).toBeInstanceOf(UnknownValidator);

		const never = new NeverValidator();
		expect(ops.normalize(never)).toBeInstanceOf(NeverValidator);

		const union = new UnionValidator({variants: [unknown, never]});
		expect(ops.normalize(union)).toBeInstanceOf(UnknownValidator);

		const intersect = new IntersectValidator({variants: [unknown, never]});
		expect(ops.normalize(intersect)).toBeInstanceOf(NeverValidator);

		const mock = new MockValidator();
		expect(ops.normalize(mock)).toBe(mock);
	});

	test('Testing isEqual', () => {
		const unknown1 = new UnknownValidator();
		const unknown2 = new UnknownValidator();
		expect(ops.isEqual(unknown1, unknown2)).toBe(true);
		expect(ops.isEqual(unknown1, unknown1)).toBe(true);

		const never = new NeverValidator();
		expect(ops.isEqual(unknown1, never)).toBe(false);
		expect(ops.isEqual(never, never)).toBe(true);

		const union1 = new UnionValidator({variants: [unknown1]});
		const union2 = new UnionValidator({variants: [unknown2]});
		// Note: isEqual calls normalize. normalize(Union(unknown)) returns Unknown.
		// So isEqual(Union(unknown), Union(unknown)) -> isEqual(Unknown, Unknown) -> true.
		expect(ops.isEqual(union1, union2)).toBe(true);

		const intersect1 = new IntersectValidator({variants: [unknown1]});
		const intersect2 = new IntersectValidator({variants: [unknown2]});
		expect(ops.isEqual(intersect1, intersect2)).toBe(true);

		const mock = new MockValidator();
		expect(ops.isEqual(mock, unknown1)).toBe(false);

		// To test _isEqualValidatorSet (via _isEqual), we need validators that DON'T normalize away
		// and ARE instances of UnionValidator/IntersectValidator after normalization.
		// A Union with 2 or more non-subset variants will remain a Union.
		const other = new OtherValidator();
		const unionA = new UnionValidator({variants: [mock, other]});
		const unionB = new UnionValidator({variants: [other, mock]});
		expect(ops.isEqual(unionA, unionB)).toBe(true);

		// Test _isEqualValidatorSet branch: length mismatch
		new UnionValidator({variants: [mock, other, new UnknownValidator()]});
		// normalize(unionC) -> Unknown (because of unknown)
		// We need something that stays Union but different length
		// actually, normalized unions with different variants that are not subsets will have different lengths or different content.

		const mock2 = new MockValidator(); // same as mock but different instance
		new UnionValidator({variants: [mock, mock2]}); // normalize -> MockValidator

		// Let's use custom ops to force Union to stay Union if needed, or just be careful.
		// (mock | other) is normalized to Union([mock, other])
		// (mock | other | never) is normalized to Union([mock, other])
		expect(ops.isEqual(unionA, new UnionValidator({variants: [mock, other, never]}))).toBe(true);
		expect(ops.isEqual(unionA, new UnionValidator({variants: [mock]}))).toBe(false);
	});

	test('Testing isSubset', () => {
		const unknown = new UnknownValidator();
		const never = new NeverValidator();
		const mock = new MockValidator();

		expect(ops.isSubset(unknown, unknown)).toBe(true);
		expect(ops.isSubset(never, unknown)).toBe(true);
		expect(ops.isSubset(unknown, never)).toBe(false);
		expect(ops.isSubset(mock, unknown)).toBe(true);
		expect(ops.isSubset(unknown, mock)).toBe(false);
		expect(ops.isSubset(never, mock)).toBe(true);
		expect(ops.isSubset(mock, never)).toBe(false);

		const union = new UnionValidator({variants: [never, mock]});
		expect(ops.isSubset(union, mock)).toBe(true); // Union(never, mock) is subset of mock
		expect(ops.isSubset(mock, union)).toBe(true); // mock is subset of Union(never, mock)

		// Test isSubset(a, Union) -> b.rules.variants.some branch
		const other = new OtherValidator();
		const union2 = new UnionValidator({variants: [mock, other]});
		expect(ops.isSubset(mock, union2)).toBe(true);

		const intersect = new IntersectValidator({variants: [unknown, mock]});
		expect(ops.isSubset(mock, intersect)).toBe(true);
		expect(ops.isSubset(intersect, mock)).toBe(true);

		// To test isSubset(Intersect, b) branch, we need a custom isSubset that works for members
		const customOps = new Operations({
			normalize: new Map(),
			merge: new Map(),
			isEqual: new Map(),
			isSubset: new Map([[MockValidator, new Map([[OtherValidator, () => true]])]])
		});
		const intersect2 = new IntersectValidator({variants: [mock]});
		expect(customOps.isSubset(intersect2, mock)).toBe(true);

		// Test isSubset(a, Intersect) -> b.rules.variants.every branch
		expect(ops.isSubset(mock, new IntersectValidator({variants: [unknown, mock]}))).toBe(true);
		expect(ops.isSubset(mock, new IntersectValidator({variants: [mock, other]}))).toBe(false);

		expect(ops.isSubset(mock, other)).toBe(false);
	});

	test('Testing merge', () => {
		const unknown = new UnknownValidator();
		const never = new NeverValidator();
		const mock = new MockValidator();
		const other = new OtherValidator();

		expect(ops.merge(unknown, unknown)).toBeInstanceOf(UnknownValidator);
		expect(ops.merge(unknown, never)).toBeInstanceOf(NeverValidator);
		expect(ops.merge(never, unknown)).toBeInstanceOf(NeverValidator);
		expect(ops.merge(never, never)).toBeInstanceOf(NeverValidator);
		expect(ops.merge(unknown, mock)).toBeInstanceOf(MockValidator);
		expect(ops.merge(mock, unknown)).toBeInstanceOf(MockValidator);

		// Test merge(Union, b)
		const union = new UnionValidator({variants: [mock]});
		expect(ops.merge(union, unknown)).toBeInstanceOf(MockValidator);
		// Test merge(a, Union)
		expect(ops.merge(unknown, union)).toBeInstanceOf(MockValidator);

		// Test merge with Union both sides
		const union2 = new UnionValidator({variants: [other]});
		// merge(Union(mock), Union(other)) -> Union(merge(mock, Union(other))) -> Union(Union(merge(mock, other)))
		// This will throw because mock and other don't merge
		expect(() => ops.merge(union, union2)).toThrow(MergeError);

		// Test merge(Intersect, b)
		const intersect = new IntersectValidator({variants: [mock]});
		// Intersect([mock]) & unknown -> mock (normalized)
		expect(ops.merge(intersect, unknown)).toBeInstanceOf(MockValidator);

		// Test merge(a, Intersect)
		expect(ops.merge(unknown, intersect)).toBeInstanceOf(MockValidator);

		expect(() => ops.merge(mock, other)).toThrow(MergeError);
	});

	test('Testing complex Union normalization', () => {
		const unknown = new UnknownValidator();
		const never = new NeverValidator();
		const mock = new MockValidator();

		// Nested unions and deduplication
		const unionNested = new UnionValidator({
			variants: [
				new UnionValidator({variants: [mock]}),
				mock,
				never
			]
		});
		const normalized = ops.normalize(unionNested);
		expect(normalized).toBeInstanceOf(MockValidator);

		const unionEmpty = new UnionValidator({variants: []});
		expect(ops.normalize(unionEmpty)).toBeInstanceOf(NeverValidator);

		// subset reduction
		const unionSubset = new UnionValidator({variants: [mock, unknown]});
		expect(ops.normalize(unionSubset)).toBeInstanceOf(UnknownValidator);
	});

	test('Testing complex Intersect normalization', () => {
		const unknown = new UnknownValidator();
		const never = new NeverValidator();
		const mock = new MockValidator();

		const intersectNested = new IntersectValidator({
			variants: [
				new IntersectValidator({variants: [mock]}),
				unknown
			]
		});
		expect(ops.normalize(intersectNested)).toBeInstanceOf(MockValidator);

		const intersectNever = new IntersectValidator({variants: [mock, never]});
		expect(ops.normalize(intersectNever)).toBeInstanceOf(NeverValidator);

		const intersectEmpty = new IntersectValidator({variants: []});
		expect(ops.normalize(intersectEmpty)).toBeInstanceOf(UnknownValidator);

		// Branch: MergeError in _normalizeIntersect
		const other = new OtherValidator();
		const intersectMergeFail = new IntersectValidator({variants: [mock, other]});
		const normalizedFail = ops.normalize(intersectMergeFail);
		expect(normalizedFail).toBeInstanceOf(IntersectValidator);
	});

	test('Testing Operations.merge static method', () => {
		const op1 = new Operations();
		const op2 = new Operations();

		expect(Operations.merge([])).toBeInstanceOf(Operations);
		expect(Operations.merge([op1])).toBe(op1);
		expect(Operations.merge([op1, op2])).toBeInstanceOf(Operations);
	});

	test('Testing Registered Operations', () => {
		const normalizeMock = jest.fn(v => v);
		const mergeMock = jest.fn((a, _b) => a.clone());
		const isEqualMock = jest.fn((_a, _b) => true);
		const isSubsetMock = jest.fn((_a, _b) => true);

		const customOps = new Operations({
			normalize: new Map([[MockValidator, normalizeMock]]),
			merge: new Map([[MockValidator, new Map([[OtherValidator, mergeMock]])]]),
			isEqual: new Map([[MockValidator, new Map([[OtherValidator, isEqualMock]])]]),
			isSubset: new Map([[MockValidator, new Map([[OtherValidator, isSubsetMock]])]]),
		});

		const mock = new MockValidator();
		const other = new OtherValidator();

		customOps.normalize(mock);
		expect(normalizeMock).toHaveBeenCalled();

		// merge(mock, other) calls normalize(mock) and normalize(other) first.
		// then _merge(mock, other)
		// _merge(a, b) calls this._isEqual(a, b) first!
		// _isEqual(mock, other) will use the registered isEqual operation and return TRUE.
		// If _isEqual returns true, _merge returns a.clone() and DOES NOT CALL the merge operation.

		// So let's make isEqual return false.
		isEqualMock.mockReturnValue(false);

		customOps.merge(mock, other);
		expect(mergeMock).toHaveBeenCalled();

		customOps.isEqual(mock, other);
		expect(isEqualMock).toHaveBeenCalled();

		customOps.isSubset(mock, other);
		expect(isSubsetMock).toHaveBeenCalled();
	});

	test('Testing Operations Merge Conflicts', () => {
		const op1 = new Operations({
			normalize: new Map([[MockValidator, v => v]]),
			merge: new Map([[MockValidator, new Map([[OtherValidator, (a, _b) => a]])]]),
			isEqual: new Map([[MockValidator, new Map([[OtherValidator, (_a, _b) => true]])]]),
			isSubset: new Map([[MockValidator, new Map([[OtherValidator, (_a, _b) => true]])]]),
		});

		const op2 = new Operations({
			normalize: new Map([[MockValidator, v => v]]),
			merge: new Map(),
			isEqual: new Map(),
			isSubset: new Map()
		});
		expect(() => Operations.merge([op1, op2])).toThrow(DomainError);

		const op3 = new Operations({
			normalize: new Map(),
			merge: new Map([[MockValidator, new Map([[OtherValidator, (a, _b) => a]])]]),
			isEqual: new Map(),
			isSubset: new Map()
		});
		expect(() => Operations.merge([op1, op3])).toThrow(DomainError);

		const op4 = new Operations({
			normalize: new Map(),
			merge: new Map(),
			isEqual: new Map([[MockValidator, new Map([[OtherValidator, (_a, _b) => true]])]]),
			isSubset: new Map()
		});
		expect(() => Operations.merge([op1, op4])).toThrow(DomainError);

		const op5 = new Operations({
			normalize: new Map(),
			merge: new Map(),
			isEqual: new Map(),
			isSubset: new Map([[MockValidator, new Map([[OtherValidator, (_a, _b) => true]])]]),
		});
		expect(() => Operations.merge([op1, op5])).toThrow(DomainError);
	});
});
