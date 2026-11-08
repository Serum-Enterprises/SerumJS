import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, NeverValidator, AssertError} from "../../../src";

describe("Testing NeverValidator", () => {
	const values = [
		undefined,
		null,
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
	const validator: NeverValidator = new NeverValidator();

	test("Testing NeverValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing NeverValidator.assert without a Path", () => {
		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to not exist");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing UnknownValidator.assert with a custom Path", () => {
		for (const value of values) {
			assert.throws(() => {
				validator.assert(value, "data");
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected data to not exist");
				assert.equal(error.path, "data");

				return true;
			});
		}
	});
});