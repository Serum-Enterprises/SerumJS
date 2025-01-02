const JSON = require('../build/JSON');

describe('Testing JSON', () => {
	test('Testing JSON.isNull', () => {
		expect(JSON.isNull(null)).toBe(true);
		expect(JSON.isNull(undefined)).toBe(false);
		expect(JSON.isNull("Hello World")).toBe(false);
	});

	test('Testing JSON.isBoolean', () => {
		expect(JSON.isBoolean(true)).toBe(true);
		expect(JSON.isBoolean(false)).toBe(true);
		expect(JSON.isBoolean("Hello World")).toBe(false);
	});

	test('Testing JSON.isNumber', () => {
		expect(JSON.isNumber(42)).toBe(true);
		expect(JSON.isNumber(Infinity)).toBe(false);
		expect(JSON.isNumber(NaN)).toBe(false);
	});

	test('Testing JSON.isInteger', () => {
		expect(JSON.isInteger(42)).toBe(true);
		expect(JSON.isInteger(42.1)).toBe(false);
		expect(JSON.isInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
	});

	test('Testing JSON.isString', () => {
		expect(JSON.isString("Hello World")).toBe(true);
		expect(JSON.isString(42)).toBe(false);
	});

	test('Testing JSON.isShallowArray', () => {
		expect(JSON.isShallowArray([null, 1, "Hello", { key: "World" }])).toBe(true);
		expect(JSON.isShallowArray([null, 1, "Hello World", undefined])).toBe(true);
		expect(JSON.isShallowArray({})).toBe(false);
	});

	test('Testing JSON.isArray', () => {
		expect(JSON.isArray([null, 1, "Hello", { key: "World" }])).toBe(true);
		expect(JSON.isArray([null, 1, "Hello World", undefined])).toBe(false);
		expect(JSON.isArray({})).toBe(false);
	});

	test('Testing JSON.isShallowObject', () => {
		expect(JSON.isShallowObject({ key: "Hello World", nested: { anotherKey: null } })).toBe(true);
		expect(JSON.isShallowObject({ key: undefined })).toBe(true);
		expect(JSON.isShallowObject([])).toBe(false);
	});

	test('Testing JSON.isObject', () => {
		expect(JSON.isObject({ key: "Hello World", nested: { anotherKey: null } })).toBe(true);
		expect(JSON.isObject({ key: undefined })).toBe(false);
		expect(JSON.isShallowObject([])).toBe(false);
	});

	test('Testing JSON.isPrimitive', () => {
		expect(JSON.isPrimitive(null)).toBe(false);
		expect(JSON.isPrimitive(true)).toBe(true);
		expect(JSON.isPrimitive(42)).toBe(true);
		expect(JSON.isPrimitive("Hello World")).toBe(true);
		expect(JSON.isPrimitive([])).toBe(false);
		expect(JSON.isPrimitive({})).toBe(false);
	});

	test('Testing JSON.isShallowContainer', () => {
		expect(JSON.isShallowContainer(null)).toBe(false);
		expect(JSON.isShallowContainer(true)).toBe(false);
		expect(JSON.isShallowContainer(42)).toBe(false);
		expect(JSON.isShallowContainer("Hello World")).toBe(false);
		expect(JSON.isShallowContainer([null, 1, "Hello", { key: "World" }])).toBe(true);
		expect(JSON.isShallowContainer([null, 1, "Hello World", undefined])).toBe(true);
		expect(JSON.isShallowContainer({ key: "Hello World", nested: { anotherKey: null } })).toBe(true);
		expect(JSON.isShallowContainer({ key: undefined })).toBe(true);
	});

	test('Testing JSON.isContainer', () => {
		expect(JSON.isContainer(null)).toBe(false);
		expect(JSON.isContainer(true)).toBe(false);
		expect(JSON.isContainer(42)).toBe(false);
		expect(JSON.isContainer("Hello World")).toBe(false);
		expect(JSON.isContainer([null, 1, "Hello", { key: "World" }])).toBe(true);
		expect(JSON.isContainer([null, 1, "Hello World", undefined])).toBe(false);
		expect(JSON.isContainer({ key: "Hello World", nested: { anotherKey: null } })).toBe(true);
		expect(JSON.isContainer({ key: undefined })).toBe(false);
	});

	test('Testing JSON.isShallowJSON', () => {
		expect(JSON.isShallowJSON(null)).toBe(true);
		expect(JSON.isShallowJSON(true)).toBe(true);
		expect(JSON.isShallowJSON(42)).toBe(true);
		expect(JSON.isShallowJSON("Hello World")).toBe(true);
		expect(JSON.isShallowJSON([null, 1, "Hello", { key: "World" }])).toBe(true);
		expect(JSON.isShallowJSON([null, 1, "Hello World", undefined])).toBe(true);
		expect(JSON.isShallowJSON({ key: "Hello World", nested: { anotherKey: null } })).toBe(true);
		expect(JSON.isShallowJSON({ key: undefined })).toBe(true);
	});

	test('Testing JSON.isJSON', () => {
		expect(JSON.isJSON(null)).toBe(true);
		expect(JSON.isJSON(true)).toBe(true);
		expect(JSON.isJSON(42)).toBe(true);
		expect(JSON.isJSON("Hello World")).toBe(true);
		expect(JSON.isJSON([null, 1, "Hello", { key: "World" }])).toBe(true);
		expect(JSON.isJSON([null, 1, "Hello World", undefined])).toBe(false);
		expect(JSON.isJSON({ key: "Hello World", nested: { anotherKey: null } })).toBe(true);
		expect(JSON.isJSON({ key: undefined })).toBe(false);
	});

	test('Testing JSON.clone', () => {
		const obj = { key: "Hello World", nested: [1, 2, { deep: true }] };
		const clonedObj = JSON.clone(obj);

		expect(clonedObj).toEqual(obj);
		expect(clonedObj).not.toBe(obj);
		expect(clonedObj.nested).not.toBe(obj.nested);
		expect(clonedObj.nested[2]).not.toBe(obj.nested[2]);
	});
});