import * as assert from "node:assert";
import {describe, test} from "node:test";
import {Validator, UnknownValidator, DefinitionError, Domain} from "../../../src";

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
	const validator: UnknownValidator = new UnknownValidator({});

	test("Testing UnknownValidator being a Validator", () => {
		assert.ok(validator instanceof Validator);
	});

	test("Testing UnknownValidator.fromJSON", () => {
		const domain = Domain.create({});
		const result = UnknownValidator.fromJSON({type: "unknown"}, "schema", domain);

		assert.ok(result instanceof UnknownValidator);

		assert.throws(() => {
			UnknownValidator.fromJSON({type: "unknown", unexpected: true}, "schema", domain);
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.message, "Expected schema to be a valid UnknownValidatorDefinition");
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof DefinitionError);
			assert.equal(error.errors[0].message, "Unknown Property schema.unexpected");
			assert.equal(error.errors[0].path, "schema.unexpected");

			return true;
		});
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

	test("Testing UnknownValidator.toJSON", () => {
		assert.deepStrictEqual(validator.toJSON(), {type: "unknown"});
	});
});
