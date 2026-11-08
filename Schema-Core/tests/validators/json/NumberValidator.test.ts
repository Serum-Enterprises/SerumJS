import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, AssertError} from "../../../src";
import {NumberValidator} from "../../../src/validators/json/NumberValidator";

describe("Testing NumberValidator", () => {
	const values = [
		undefined,
		null,
		true,
		false,
		"",
		"Hello World",
		[],
		[1, 2, 3, [1, 2, 3], "Hello World"],
		{"name": "Hello World", age: 50},
		new Date(),
		() => {}
	];
	const validator: NumberValidator = new NumberValidator({});

	test("Testing NumberValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing NumberValidator.assert without a Path", () => {
		for (const value of [0, -123, 123, -123.123, 123.123]) {
			assert.doesNotThrow(() => {
				validator.assert(value);
			});
		}

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be a Number");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing NumberValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert(123, "data");
		});

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value, "data");
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected data to be a Number");
				assert.equal(error.path, "data");

				return true;
			});
		}
	});

	test("Testing NumberValidator.integer", () => {
		const integerValidator: NumberValidator<{
			readonly integer: true
		}> = validator.integer();
		const nonIntegerValidator: NumberValidator<{
			readonly integer: false
		}> = validator.integer(false);

		for (const value of [-123, 0, 123, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]) {
			assert.doesNotThrow(() => {
				integerValidator.assert(value);
			});
		}

		for (const value of [-123.123, 123.123, Number.MAX_SAFE_INTEGER + 1]) {
			assert.throws(() => {
				integerValidator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be an Integer");
				assert.equal(error.path, "value");

				return true;
			});
		}

		assert.doesNotThrow(() => {
			nonIntegerValidator.assert(123.123);
		});
	});

	test("Testing NumberValidator.min", () => {
		const minValidator: NumberValidator<{
			readonly min: 10
		}> = validator.min(10);

		assert.doesNotThrow(() => {
			minValidator.assert(10);
			minValidator.assert(11);
		});

		assert.throws(() => {
			minValidator.assert(9, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be at least 10");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing NumberValidator.max", () => {
		const maxValidator: NumberValidator<{
			readonly max: 10
		}> = validator.max(10);

		assert.doesNotThrow(() => {
			maxValidator.assert(9);
			maxValidator.assert(10);
		});

		assert.throws(() => {
			maxValidator.assert(11, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be at most 10");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing NumberValidator.equals", () => {
		const equalsValidator: NumberValidator<{
			readonly equals: 10
		}> = validator.equals(10);

		assert.doesNotThrow(() => {
			equalsValidator.assert(10);
		});

		assert.throws(() => {
			equalsValidator.assert(11, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be 10");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing NumberValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "number"});
		assert.deepStrictEqual(
			validator.integer().min(1).max(10).equals(5).toJSON(),
			{
				type: "number",
				integer: true,
				min: 1,
				max: 10,
				equals: 5
			}
		);
		assert.deepStrictEqual(validator.integer(false).toJSON(), {
			type: "number",
			integer: false
		});
	});
});
