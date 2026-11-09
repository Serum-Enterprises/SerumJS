import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, AssertError} from "../../../src";
import {IntersectValidator} from "../../../src/validators/core/IntersectValidator";
import {NumberValidator} from "../../../src/validators/json/NumberValidator";
import {StringValidator} from "../../../src/validators/json/StringValidator";

describe("Testing IntersectValidator", () => {
	const minimumValidator: NumberValidator = new NumberValidator({}).min(0);
	const integerValidator: NumberValidator = new NumberValidator({}).integer();
	const stringValidator: StringValidator = new StringValidator({});
	const validator: IntersectValidator<{
		readonly variants: readonly [NumberValidator, NumberValidator]
	}> = new IntersectValidator({
		variants: [minimumValidator, integerValidator]
	});

	test("Testing IntersectValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing IntersectValidator.assert without a Path", () => {
		for (const value of [0, 1, 123]) {
			assert.doesNotThrow(() => {
				validator.assert(value);
			});
		}

		assert.throws(() => {
			validator.assert(-1);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected value to satisfy every intersection variant");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected value to be at least 0");
			assert.equal(error.errors[0].path, "value");

			return true;
		});

		assert.throws(() => {
			validator.assert(1.5);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected value to be an Integer");
			assert.equal(error.errors[0].path, "value");

			return true;
		});
	});

	test("Testing IntersectValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert(123, "data");
		});

		assert.throws(() => {
			validator.assert(-1.5, "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected data to satisfy every intersection variant");
			assert.equal(error.errors.length, 2);
			assert.equal(error.errors[0].message, "Expected data to be at least 0");
			assert.equal(error.errors[0].path, "data");
			assert.equal(error.errors[1].message, "Expected data to be an Integer");
			assert.equal(error.errors[1].path, "data");

			return true;
		});
	});

	test("Testing IntersectValidator.variants", () => {
		const stringIntersectValidator: IntersectValidator<{
			readonly variants: readonly [StringValidator]
		}> = validator.variants([stringValidator]);

		assert.doesNotThrow(() => {
			stringIntersectValidator.assert("Hello World");
		});

		assert.throws(() => {
			stringIntersectValidator.assert(123);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected value to be a String");

			return true;
		});
	});

	test("Testing IntersectValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {
			type: "intersect",
			variants: [
				{type: "number", min: 0},
				{type: "number", integer: true}
			]
		});
	});
});
