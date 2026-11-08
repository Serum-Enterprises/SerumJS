import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, UnknownValidator} from "../../../src";

describe("Testing UnknownValidator", () => {
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
	const validator: UnknownValidator = new UnknownValidator();

	test("Testing UnknownValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing UnknownValidator.assert without a Path", () => {
		for (const value of values) {
			assert.doesNotThrow(() => {
				validator.assert(value);
			});
		}
	});

	test("Testing UnknownValidator.assert with a custom Path", () => {
		for (const value of values) {
			assert.doesNotThrow(() => {
				validator.assert(value, "data");
			});
		}
	});
});