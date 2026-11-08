import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, AssertError} from "../../../src";
import {BooleanValidator} from "../../../src/validators/json/BooleanValidator";

describe("Testing BooleanValidator", () => {
	const values = [
		undefined,
		null,
		0,
		-123,
		123,
		-123.123,
		"",
		"Hello World",
		[],
		[1, 2, 3, [1, 2, 3], "Hello World"],
		{"name": "Hello World", age: 50},
		new Date(),
		() => {}
	];
	const validator: BooleanValidator = new BooleanValidator({});

	test("Testing BooleanValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing BooleanValidator.assert without a Path", () => {
		assert.doesNotThrow(() => {
			validator.assert(true);
			validator.assert(false);
		});

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be a Boolean");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing BooleanValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert(true, "data");
			validator.assert(false, "data");
		});

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value, "data");
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected data to be a Boolean");
				assert.equal(error.path, "data");

				return true;
			});
		}
	});

	test("Testing BooleanValidator.equals", () => {
		const trueValidator: BooleanValidator<{
			readonly equals: true
		}> = validator.equals(true);

		const falseValidator: BooleanValidator<{
			readonly equals: false
		}> = validator.equals(false);

		assert.doesNotThrow(() => {
			trueValidator.assert(true);
			falseValidator.assert(false);
		});

		assert.throws(() => {
			trueValidator.assert(false);
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected value to be true");
			assert.equal(error.path, "value");

			return true;
		});

		assert.throws(() => {
			falseValidator.assert(true, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be false");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing BooleanValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "boolean"});
		assert.deepStrictEqual(validator.equals(true).toJSON(), {
			type: "boolean",
			equals: true
		});
		assert.deepStrictEqual(validator.equals(false).toJSON(), {
			type: "boolean",
			equals: false
		});
	});
});
