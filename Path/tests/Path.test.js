const Path = require('../build/Path.js');

describe('Testing Path', () => {
	test('Testing isPath', () => {
		expect(Path.isPath([])).toBe(true);
		expect(Path.isPath(['a', 'b', 1])).toBe(true);
		expect(Path.isPath(['a', 'b', 1.5])).toBe(false);
		expect(Path.isPath(['a', 'b', {}])).toBe(false);
	});

	test('Testing toString', () => {
		const path = ['a', 'b', 1, 'c'];
		const regularResult = Path.toString(path);
		const startResult = Path.toString(path, 1);

		expect(regularResult).toBe('a.b[1].c');
		expect(startResult).toBe('b[1].c');
	});

	test('Testing equals', () => {
		const path1 = ['a', 'b', 1];
		const path2 = ['a', 'b', 2];
		const equalsResult = Path.equals(path1, path1);
		const notEqualsResult = Path.equals(path1, path2);

		expect(equalsResult).toBe(true);
		expect(notEqualsResult).toBe(false);
	});

	test('Testing set', () => {
		const prependArrayResult = Path.set({ a: {} }, ['a', 'b', -1], "Hello");
		const appendArrayResult = Path.set({ a: {} }, ['a', 'b', 1], "Hello");
		const arrayResult = Path.set({ a: {} }, ['a', 'b', 0], "Hello");
		const objectResult = Path.set({ a: {} }, ['a', 'b', 'c'], "Hello");

		expect(prependArrayResult.isOk()).toBe(true);
		expect(prependArrayResult.value).toStrictEqual({ a: { b: ["Hello"] } });

		expect(appendArrayResult.isOk()).toBe(true);
		expect(appendArrayResult.value).toStrictEqual({ a: { b: [null, "Hello"] } });

		expect(arrayResult.isOk()).toBe(true);
		expect(arrayResult.value).toStrictEqual({ a: { b: ["Hello"] } });

		expect(objectResult.isOk()).toBe(true);
		expect(objectResult.value).toStrictEqual({ a: { b: { c: "Hello" } } });
	});

	test('Testing get', () => {
		const arrayResult = Path.get({ a: { b: ["Hello"] } }, ['a', 'b', 0]);
		const objectResult = Path.get({ a: { b: { c: "Hello" } } }, ['a', 'b', 'c']);

		expect(arrayResult.isOk()).toBe(true);
		expect(arrayResult.value).toBe("Hello");

		expect(objectResult.isOk()).toBe(true);
		expect(objectResult.value).toBe("Hello");
	});

	test('Testing has', () => {
		const hasArrayResult = Path.has({ a: { b: ["Hello"] } }, ['a', 'b', 0]);
		const hasObjectResult = Path.has({ a: { b: { c: "Hello" } } }, ['a', 'b', 'c']);

		expect(hasArrayResult).toBe(true);
		expect(hasObjectResult).toBe(true);
	});

	test('Testing remove', () => {
		const arrayResult = Path.remove({ a: { b: ["Hello"] } }, ['a', 'b', 0]);
		const objectResult = Path.remove({ a: { b: { c: "Hello" } } }, ['a', 'b', 'c']);

		expect(arrayResult).toBe(true);
		expect(objectResult).toBe(true);
	});
});
