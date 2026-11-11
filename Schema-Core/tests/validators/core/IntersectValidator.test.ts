import * as assert from "node:assert";
import {describe, test} from "node:test";
import {
	Validator,
	AssertError,
	DefinitionError,
	Domain,
	IntersectValidator,
	NeverValidator,
	NumberValidator,
	StringValidator,
	UnknownValidator
} from "../../../src";

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

	test("Testing IntersectValidator.fromJSON", () => {
		const result = IntersectValidator.fromJSON({
			type: "intersect",
			variants: [
				{type: "unknown"},
				{type: "never"}
			]
		}, "schema", Domain.create({}));

		assert.ok(result instanceof IntersectValidator);
		assert.equal(result.constraints.variants.length, 2);
		assert.ok(result.constraints.variants[0] instanceof UnknownValidator);
		assert.ok(result.constraints.variants[1] instanceof NeverValidator);
	});

	test("Testing IntersectValidator.fromJSON with invalid variants", () => {
		const domain = Domain.create({});

		assert.throws(() => {
			IntersectValidator.fromJSON({type: "intersect"}, "schema", domain);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid IntersectValidatorDefinition");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof DefinitionError);
			assert.equal(error.errors[0].message, "Expected schema.variants to be an Array");
			assert.equal(error.errors[0].path, "schema.variants");

			return true;
		});

		assert.throws(() => {
			IntersectValidator.fromJSON({type: "intersect", variants: []}, "schema", domain);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid IntersectValidatorDefinition");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof DefinitionError);
			assert.equal(
				error.errors[0].message,
				"Expected schema.variants to contain at least one ValidatorDefinition"
			);
			assert.equal(error.errors[0].path, "schema.variants");

			return true;
		});
	});

	test("Testing IntersectValidator.fromJSON with invalid nested definitions", () => {
		assert.throws(() => {
			IntersectValidator.fromJSON({
				type: "intersect",
				unexpected: true,
				variants: [
					{type: "missing"},
					{type: "unknown", unexpected: true}
				]
			}, "schema", Domain.create({}));
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid IntersectValidatorDefinition");
			assert.equal(error.errors.length, 3);

			assert.ok(error.errors[0] instanceof DefinitionError);
			assert.equal(error.errors[0].message, "Unknown Property schema.unexpected");
			assert.equal(error.errors[0].path, "schema.unexpected");

			assert.ok(error.errors[1] instanceof DefinitionError);
			assert.equal(error.errors[1].message, "Validator at schema.variants[0] not found");
			assert.equal(error.errors[1].path, "schema.variants[0]");

			assert.ok(error.errors[2] instanceof AggregateError);
			assert.equal(error.errors[2].errors.length, 1);
			assert.ok(error.errors[2].errors[0] instanceof DefinitionError);
			assert.equal(
				error.errors[2].errors[0].message,
				"Unknown Property schema.variants[1].unexpected"
			);
			assert.equal(error.errors[2].errors[0].path, "schema.variants[1].unexpected");

			return true;
		});
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
