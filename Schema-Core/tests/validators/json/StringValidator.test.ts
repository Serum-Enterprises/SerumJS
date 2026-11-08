import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, AssertError} from "../../../src";
import {StringValidator} from "../../../src/validators/json/StringValidator";

describe("Testing StringValidator", () => {
	const values = [
		undefined,
		null,
		true,
		false,
		0,
		-123,
		123,
		-123.123,
		[],
		[1, 2, 3, [1, 2, 3], "Hello World"],
		{"name": "Hello World", age: 50},
		new Date(),
		() => {}
	];
	const validator: StringValidator = new StringValidator({});

	test("Testing StringValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing StringValidator.assert without a Path", () => {
		for (const value of ["", "Hello World"]) {
			assert.doesNotThrow(() => {
				validator.assert(value);
			});
		}

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be a String");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing StringValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert("Hello World", "data");
		});

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value, "data");
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected data to be a String");
				assert.equal(error.path, "data");

				return true;
			});
		}
	});

	test("Testing StringValidator.min", () => {
		const minValidator: StringValidator<{
			readonly min: 5
		}> = validator.min(5);

		assert.doesNotThrow(() => {
			minValidator.assert("Hello");
			minValidator.assert("Hello World");
		});

		assert.throws(() => {
			minValidator.assert("Test", "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be at least 5 characters long");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing StringValidator.max", () => {
		const maxValidator: StringValidator<{
			readonly max: 5
		}> = validator.max(5);

		assert.doesNotThrow(() => {
			maxValidator.assert("Test");
			maxValidator.assert("Hello");
		});

		assert.throws(() => {
			maxValidator.assert("Hello World", "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be at most 5 characters long");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing StringValidator.equals", () => {
		const equalsValidator: StringValidator<{
			readonly equals: "Hello World"
		}> = validator.equals("Hello World");

		assert.doesNotThrow(() => {
			equalsValidator.assert("Hello World");
		});

		assert.throws(() => {
			equalsValidator.assert("Test", "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be \"Hello World\"");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing StringValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "string"});
		assert.deepStrictEqual(
			validator.min(1).max(20).equals("Hello World").toJSON(),
			{
				type: "string",
				min: 1,
				max: 20,
				equals: "Hello World"
			}
		);
	});
});
