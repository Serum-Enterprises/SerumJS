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
	ObjectValidator
} from "../../../src";

describe("Testing ObjectValidator", () => {
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
		[],
		[1, 2, 3],
		new Date(),
		() => {}
	];
	const validator: ObjectValidator = new ObjectValidator({});
	const numberValidator: NumberValidator = new NumberValidator({});
	const stringValidator: StringValidator = new StringValidator({});

	test("Testing ObjectValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing ObjectValidator.fromJSON", () => {
		const result = ObjectValidator.fromJSON({
			type: "object",
			min: 1,
			max: 3,
			every: {type: "unknown"},
			shape: {
				first: {type: "never"},
				second: {type: "unknown"}
			},
			exact: true
		}, "schema", Domain.create({}));

		assert.ok(result instanceof ObjectValidator);
		assert.equal(result.constraints.min, 1);
		assert.equal(result.constraints.max, 3);
		assert.ok(result.constraints.every instanceof UnknownValidator);
		assert.ok(result.constraints.shape?.["first"] instanceof NeverValidator);
		assert.ok(result.constraints.shape?.["second"] instanceof UnknownValidator);
		assert.equal(result.constraints.exact, true);
	});

	test("Testing ObjectValidator.fromJSON with invalid constraints", () => {
		assert.throws(() => {
			ObjectValidator.fromJSON({
				type: "object",
				min: "1",
				max: null,
				every: {type: "missing"},
				shape: [],
				exact: "true",
				unexpected: true
			}, "schema", Domain.create({}));
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid ObjectValidatorDefinition");
			assert.equal(error.errors.length, 6);
			assert.deepStrictEqual(
				error.errors.map((entry) => entry.path),
				[
					"schema.unexpected",
					"schema.min",
					"schema.max",
					"schema.every",
					"schema.shape",
					"schema.exact"
				]
			);
			assert.ok(error.errors.every((entry) => entry instanceof DefinitionError));
			assert.equal(error.errors[0]!.message, "Unknown Property schema.unexpected");
			assert.equal(error.errors[1]!.message, "Expected schema.min to be a finite Number");
			assert.equal(error.errors[2]!.message, "Expected schema.max to be a finite Number");
			assert.equal(error.errors[3]!.message, "Validator at schema.every not found");
			assert.equal(error.errors[4]!.message, "Expected schema.shape to be an Object");
			assert.equal(error.errors[5]!.message, "Expected schema.exact to be a Boolean");

			return true;
		});
	});

	test("Testing ObjectValidator.fromJSON with invalid shape definitions", () => {
		assert.throws(() => {
			ObjectValidator.fromJSON({
				type: "object",
				shape: {
					first: {type: "missing"},
					second: {type: "unknown", unexpected: true}
				}
			}, "schema", Domain.create({}));
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid ObjectValidatorDefinition");
			assert.equal(error.errors.length, 2);
			assert.ok(error.errors[0] instanceof DefinitionError);
			assert.equal(error.errors[0].message, "Validator at schema.shape.first not found");
			assert.equal(error.errors[0].path, "schema.shape.first");
			assert.ok(error.errors[1] instanceof AggregateError);
			assert.equal(error.errors[1].errors.length, 1);
			assert.ok(error.errors[1].errors[0] instanceof DefinitionError);
			assert.equal(
				error.errors[1].errors[0].message,
				"Unknown Property schema.shape.second.unexpected"
			);
			assert.equal(error.errors[1].errors[0].path, "schema.shape.second.unexpected");

			return true;
		});
	});

	test("Testing ObjectValidator.assert without a Path", () => {
		assert.doesNotThrow(() => {
			validator.assert({});
			validator.assert({name: "Hello World", age: 50});
			validator.assert(Object.create(null));
		});

		for (const value of values) {
			assert.throws(() => {
				validator.assert(value);
			}, (error) => {
				assert.ok(error instanceof AssertError);
				assert.equal(error.message, "Expected value to be an Object");
				assert.equal(error.path, "value");

				return true;
			});
		}
	});

	test("Testing ObjectValidator.assert with a custom Path", () => {
		assert.doesNotThrow(() => {
			validator.assert({}, "data");
		});

		assert.throws(() => {
			validator.assert([], "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to be an Object");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing ObjectValidator.min", () => {
		const minValidator: ObjectValidator<{
			readonly min: 2
		}> = validator.min(2);

		assert.doesNotThrow(() => {
			minValidator.assert({name: "Test", age: 50});
		});

		assert.throws(() => {
			minValidator.assert({name: "Test"}, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to contain at least 2 properties");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing ObjectValidator.max", () => {
		const maxValidator: ObjectValidator<{
			readonly max: 2
		}> = validator.max(2);

		assert.doesNotThrow(() => {
			maxValidator.assert({name: "Test", age: 50});
		});

		assert.throws(() => {
			maxValidator.assert({name: "Test", age: 50, active: true}, "data");
		}, (error) => {
			assert.ok(error instanceof AssertError);
			assert.equal(error.message, "Expected data to contain at most 2 properties");
			assert.equal(error.path, "data");

			return true;
		});
	});

	test("Testing ObjectValidator.every", () => {
		const everyValidator: ObjectValidator<{
			readonly every: NumberValidator
		}> = validator.every(numberValidator);

		assert.doesNotThrow(() => {
			everyValidator.assert({});
			everyValidator.assert({first: 1, second: 2});
		});

		assert.throws(() => {
			everyValidator.assert({first: 1, second: "Test"}, "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected all properties of data to satisfy their constraints");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected data.second to be a Number");
			assert.equal(error.errors[0].path, "data.second");

			return true;
		});
	});

	test("Testing ObjectValidator.shape", () => {
		const shapeValidator: ObjectValidator<{
			readonly shape: Readonly<{
				readonly name: StringValidator,
				readonly age: NumberValidator
			}>
		}> = validator.shape({
			name: stringValidator,
			age: numberValidator
		});

		assert.doesNotThrow(() => {
			shapeValidator.assert({name: "Test", age: 50});
			shapeValidator.assert({name: "Test", age: 50, active: true});
		});

		assert.throws(() => {
			shapeValidator.assert({name: "Test"}, "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected data.age to be present");
			assert.equal(error.errors[0].path, "data.age");

			return true;
		});

		assert.throws(() => {
			shapeValidator.assert({name: 123, age: "Test"}, "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 2);
			assert.equal(error.errors[0].message, "Expected data.name to be a String");
			assert.equal(error.errors[0].path, "data.name");
			assert.equal(error.errors[1].message, "Expected data.age to be a Number");
			assert.equal(error.errors[1].path, "data.age");

			return true;
		});
	});

	test("Testing ObjectValidator.exact", () => {
		const exactValidator: ObjectValidator<{
			readonly shape: Readonly<{
				readonly name: StringValidator
			}>,
			readonly exact: true
		}> = validator.shape({name: stringValidator}).exact();
		const nonExactValidator: ObjectValidator<{
			readonly shape: Readonly<{
				readonly name: StringValidator
			}>,
			readonly exact: false
		}> = validator.shape({name: stringValidator}).exact(false);

		assert.doesNotThrow(() => {
			exactValidator.assert({name: "Test"});
			nonExactValidator.assert({name: "Test", age: 50});
		});

		assert.throws(() => {
			exactValidator.assert({name: "Test", age: 50}, "data");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof AssertError);
			assert.equal(error.errors[0].message, "Expected data.age not to be present");
			assert.equal(error.errors[0].path, "data.age");

			return true;
		});
	});

	test("Testing ObjectValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "object"});
		assert.deepStrictEqual(
			validator
				.min(1)
				.max(3)
				.every(stringValidator)
				.shape({
					name: stringValidator,
					age: numberValidator.integer()
				})
				.exact()
				.toJSON(),
			{
				type: "object",
				min: 1,
				max: 3,
				every: {type: "string"},
				shape: {
					name: {type: "string"},
					age: {type: "number", integer: true}
				},
				exact: true
			}
		);
		assert.deepStrictEqual(validator.exact(false).toJSON(), {
			type: "object",
			exact: false
		});
	});
});
