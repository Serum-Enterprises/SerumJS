import * as assert from "node:assert";
import {describe, test} from "node:test";
import {
	Validator,
	AssertError,
	DefinitionError,
	Domain,
	NeverValidator,
	UnknownValidator,
	NumberValidator,
	StringValidator,
	ArrayValidator
} from "../../../src";

describe("Testing ArrayValidator", () => {
	const values = [
		undefined,
		null,
		true,
		false,
		0,
		-123,
		123.123,
		"",
		"Hello World",
		{"name": "Hello World", age: 50},
		new Date(),
		() => {}
	];
	const validator: ArrayValidator = new ArrayValidator({});
	const numberValidator: NumberValidator = new NumberValidator({});
	const stringValidator: StringValidator = new StringValidator({});

	test("Testing ArrayValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing ArrayValidator.fromJSON", () => {
		const result = ArrayValidator.fromJSON({
			type: "array",
			min: 1,
			max: 3,
			every: {type: "unknown"},
			tuple: [
				{type: "never"},
				{type: "unknown"}
			]
		}, "schema", Domain.create({}));

		assert.ok(result instanceof ArrayValidator);
		assert.equal(result.constraints.min, 1);
		assert.equal(result.constraints.max, 3);
		assert.ok(result.constraints.every instanceof UnknownValidator);
		assert.equal(result.constraints.tuple?.length, 2);
		assert.ok(result.constraints.tuple?.[0] instanceof NeverValidator);
		assert.ok(result.constraints.tuple?.[1] instanceof UnknownValidator);
	});

	test("Testing ArrayValidator.fromJSON with invalid constraints", () => {
		assert.throws(() => {
			ArrayValidator.fromJSON({
				type: "array",
				min: "1",
				max: null,
				every: {type: "missing"},
				tuple: "invalid",
				unexpected: true
			}, "schema", Domain.create({}));
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid ArrayValidatorDefinition");
			assert.equal(error.errors.length, 5);
			assert.deepStrictEqual(
				error.errors.map((entry) => entry.path),
				["schema.unexpected", "schema.min", "schema.max", "schema.every", "schema.tuple"]
			);
			assert.ok(error.errors.every((entry) => entry instanceof DefinitionError));
			assert.equal(error.errors[0]!.message, "Unknown Property schema.unexpected");
			assert.equal(error.errors[1]!.message, "Expected schema.min to be a finite Number");
			assert.equal(error.errors[2]!.message, "Expected schema.max to be a finite Number");
			assert.equal(error.errors[3]!.message, "Validator at schema.every not found");
			assert.equal(error.errors[4]!.message, "Expected schema.tuple to be an Array");

			return true;
		});
	});

	test("Testing ArrayValidator.fromJSON with an invalid tuple definition", () => {
		assert.throws(() => {
			ArrayValidator.fromJSON({
				type: "array",
				tuple: [
					{type: "unknown", unexpected: true}
				]
			}, "schema", Domain.create({}));
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid ArrayValidatorDefinition");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AggregateError);
			assert.equal(error.errors[0].errors.length, 1);
			assert.ok(error.errors[0].errors[0] instanceof DefinitionError);
			assert.equal(
				error.errors[0].errors[0].message,
				"Unknown Property schema.tuple[0].unexpected"
			);
			assert.equal(error.errors[0].errors[0].path, "schema.tuple[0].unexpected");

			return true;
		});
	});

	test("Testing ArrayValidator.assert without a Path", () => {
		for (const value of [[], [1, 2, 3], [1, "Test", null]]) {
			assert.doesNotThrow(() => {
				validator.assert(value);
			});
		}

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be an Array");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing ArrayValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert([], "data");
		});

		assert.throws(() => {
			validator.assert({}, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be an Array");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing ArrayValidator.min", () => {
		const minValidator: ArrayValidator<{
			readonly min: 2
		}> = validator.min(2);

		assert.doesNotThrow(() => {
			minValidator.assert([1, 2]);
			minValidator.assert([1, 2, 3]);
		});

		assert.throws(() => {
			minValidator.assert([1], "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to contain at least 2 elements");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing ArrayValidator.max", () => {
		const maxValidator: ArrayValidator<{
			readonly max: 2
		}> = validator.max(2);

		assert.doesNotThrow(() => {
			maxValidator.assert([1]);
			maxValidator.assert([1, 2]);
		});

		assert.throws(() => {
			maxValidator.assert([1, 2, 3], "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to contain at most 2 elements");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing ArrayValidator.every", () => {
		const everyValidator: ArrayValidator<{
			readonly every: NumberValidator
		}> = validator.every(numberValidator);

		assert.doesNotThrow(() => {
			everyValidator.assert([]);
			everyValidator.assert([1, 2, 3]);
		});

		assert.throws(() => {
			everyValidator.assert([1, "Test", 3], "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected all elements of data to satisfy their constraints");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected data[1] to be a Number");
			assert.equal(error.errors[0].path, "data[1]");

			return true;
		});
	});

	test("Testing ArrayValidator.tuple", () => {
		const tupleValidator: ArrayValidator<{
			readonly tuple: readonly [StringValidator, NumberValidator]
		}> = validator.tuple([stringValidator, numberValidator]);

		assert.doesNotThrow(() => {
			tupleValidator.assert(["Test", 123]);
			tupleValidator.assert(["Test", 123, null]);
		});

		assert.throws(() => {
			tupleValidator.assert(["Test"], "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to contain at least 2 elements");
			assert.equal(error.path, "data");

			return true;
		});

		assert.throws(() => {
			tupleValidator.assert([123, "Test"], "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 2);
			assert.equal(error.errors[0].message, "Expected data[0] to be a String");
			assert.equal(error.errors[0].path, "data[0]");
			assert.equal(error.errors[1].message, "Expected data[1] to be a Number");
			assert.equal(error.errors[1].path, "data[1]");

			return true;
		});
	});

	test("Testing ArrayValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "array"});
		assert.deepStrictEqual(
			validator
				.min(1)
				.max(3)
				.every(numberValidator)
				.tuple([numberValidator, numberValidator.integer()])
				.toJSON(),
			{
				type: "array",
				min: 1,
				max: 3,
				every: {type: "number"},
				tuple: [
					{type: "number"},
					{type: "number", integer: true}
				]
			}
		);
	});
});
