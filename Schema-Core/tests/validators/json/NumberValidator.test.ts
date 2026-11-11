import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, AssertError, DefinitionError, Domain, NumberValidator} from "../../../src";

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

	test("Testing NumberValidator.fromJSON", () => {
		const domain = Domain.create({});
		const result = NumberValidator.fromJSON({
			type: "number",
			integer: true,
			min: 1,
			max: 10,
			equals: 5
		}, "schema", domain);

		assert.ok(result instanceof NumberValidator);
		assert.deepStrictEqual(result.constraints, {
			integer: true,
			min: 1,
			max: 10,
			equals: 5
		});

		assert.throws(() => {
			NumberValidator.fromJSON({
				type: "number",
				integer: "true",
				min: "1",
				max: null,
				equals: false,
				unexpected: true
			}, "schema", domain);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid NumberValidatorDefinition");
			assert.equal(error.errors.length, 5);
			assert.deepStrictEqual(
				error.errors.map((entry) => entry.path),
				["schema.unexpected", "schema.integer", "schema.min", "schema.max", "schema.equals"]
			);
			assert.ok(error.errors.every((entry) => entry instanceof DefinitionError));
			assert.equal(error.errors[0]!.message, "Unknown Property schema.unexpected");
			assert.equal(error.errors[1]!.message, "Expected schema.integer to be a Boolean");
			assert.equal(error.errors[2]!.message, "Expected schema.min to be a finite Number");
			assert.equal(error.errors[3]!.message, "Expected schema.max to be a finite Number");
			assert.equal(error.errors[4]!.message, "Expected schema.equals to be a finite Number");

			return true;
		});
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
