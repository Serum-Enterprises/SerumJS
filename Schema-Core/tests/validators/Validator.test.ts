import * as assert from "node:assert";
import {describe, test} from "node:test";
import {AssertError} from "../../src";
import {
	Validator,
	type InferValidatorResult
} from "../../src/validators/Validator";

class MockValidator extends Validator<string> {
	public lastPath: string | undefined;

	public assert(value: unknown, path: string = "value"): asserts value is string {
		this.lastPath = path;

		if (typeof value !== "string")
			throw new AssertError(`Expected ${path} to be a String`, path);
	}

	public toJSON(): { type: "test" } {
		return {type: "test"};
	}
}

describe("Testing Validator", () => {
	test("Testing a concrete Validator being a Validator", () => {
		const validator: MockValidator = new MockValidator();

		assert.ok(validator instanceof Validator);
	});

	test("Testing Validator.validate without a Path", () => {
		const validator: MockValidator = new MockValidator();
		const value: InferValidatorResult<MockValidator> = validator.validate("Hello World");

		assert.equal(value, "Hello World");
		assert.equal(validator.lastPath, "value");

		assert.throws(() => {
			validator.validate(123);
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected value to be a String");
			assert.equal(error.path, "value");

			return true;
		});
	});

	test("Testing Validator.validate with a custom Path", () => {
		const validator: MockValidator = new MockValidator();

		assert.equal(validator.validate("Hello World", "data.name"), "Hello World");
		assert.equal(validator.lastPath, "data.name");

		assert.throws(() => {
			validator.validate(123, "data.name");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data.name to be a String");
			assert.equal(error.path, "data.name");

			return true;
		});
	});

	test("Testing Validator.test without a Path", () => {
		const validator: MockValidator = new MockValidator();
		const value: unknown = "Hello World";

		assert.equal(validator.test(value), true);
		assert.equal(validator.lastPath, "value");
		assert.equal(validator.test(123), false);
		assert.equal(validator.lastPath, "value");
	});

	test("Testing Validator.test with a custom Path", () => {
		const validator: MockValidator = new MockValidator();

		assert.equal(validator.test("Hello World", "data.name"), true);
		assert.equal(validator.lastPath, "data.name");
		assert.equal(validator.test(123, "data.name"), false);
		assert.equal(validator.lastPath, "data.name");
	});
});
