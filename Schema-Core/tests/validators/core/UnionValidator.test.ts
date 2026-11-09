import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, AssertError} from "../../../src";
import {UnionValidator} from "../../../src/validators/core/UnionValidator";
import {BooleanValidator} from "../../../src/validators/json/BooleanValidator";
import {NumberValidator} from "../../../src/validators/json/NumberValidator";
import {StringValidator} from "../../../src/validators/json/StringValidator";

describe("Testing UnionValidator", () => {
	const numberValidator: NumberValidator = new NumberValidator({});
	const stringValidator: StringValidator = new StringValidator({});
	const booleanValidator: BooleanValidator = new BooleanValidator({});
	const validator: UnionValidator<{
		readonly variants: readonly [NumberValidator, StringValidator]
	}> = new UnionValidator({
		variants: [numberValidator, stringValidator]
	});

	test("Testing UnionValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing UnionValidator.assert without a Path", () => {
		for (const value of [0, -123.123, "", "Hello World"]) {
			assert.doesNotThrow(() => {
				validator.assert(value);
			});
		}

		assert.throws(() => {
			validator.assert(true);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected value to satisfy at least one union variant");
			assert.equal(error.errors.length, 2);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected value to be a Number");
			assert.equal(error.errors[0].path, "value");
			assert.ok(error.errors[1] instanceof AssertError);
			assert.equal(error.errors[1].message, "Expected value to be a String");
			assert.equal(error.errors[1].path, "value");

			return true;
		});
	});

	test("Testing UnionValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert("Hello World", "data");
		});

		assert.throws(() => {
			validator.assert(null, "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected data to satisfy at least one union variant");
			assert.equal(error.errors.length, 2);
			assert.equal(error.errors[0].message, "Expected data to be a Number");
			assert.equal(error.errors[0].path, "data");
			assert.equal(error.errors[1].message, "Expected data to be a String");
			assert.equal(error.errors[1].path, "data");

			return true;
		});
	});

	test("Testing UnionValidator.variants", () => {
		const booleanUnionValidator: UnionValidator<{
			readonly variants: readonly [BooleanValidator]
		}> = validator.variants([booleanValidator]);

		assert.doesNotThrow(() => {
			booleanUnionValidator.assert(true);
			booleanUnionValidator.assert(false);
		});

		assert.throws(() => {
			booleanUnionValidator.assert(123);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected value to be a Boolean");

			return true;
		});
	});

	test("Testing UnionValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {
			type: "union",
			variants: [
				{type: "number"},
				{type: "string"}
			]
		});
	});
});
