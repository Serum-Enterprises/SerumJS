import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, NullValidator, AssertError} from "../../../src";

describe("Testing NullValidator", () => {
	const values = [
		undefined,
		true,
		false,
		0,
		-123,
		123,
		-123.123,
		-123,
		"",
		"Hello World",
		[],
		[1, 2, 3, [1, 2, 3], "Hello World"],
		{"name": "Hello World", age: 50},
		new Date(),
		() => {}
	];
	const validator: NullValidator = new NullValidator();

	test("Testing NullValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing NullValidator.assert without a Path", () => {
		assert.doesNotThrow(() => {
			validator.assert(null);
		});

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be Null");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing NullValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert(null, "data");
		})

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value, "data");
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected data to be Null");
				assert.equal(error.path, "data");

				return true;
			});
		}
	});

	test("Testing NullValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "null"});
	});
});