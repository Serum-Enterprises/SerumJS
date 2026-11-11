import * as assert from "node:assert";
import {describe, test} from "node:test";
import {
	DefinitionError,
	Domain,
	IntersectValidator,
	NeverValidator,
	NumberValidator,
	StringValidator,
	UnionValidator,
	UnknownValidator
} from "../src";

class DuplicateNumberValidator extends NumberValidator {}

describe("Testing Domain", () => {
	test("Testing Domain.create", () => {
		const domain = Domain.create({
			Money: NumberValidator,
			Number: NumberValidator,
			String: StringValidator
		});

		const firstNumber = domain.Number();
		const secondNumber = domain.Number();

		assert.ok(domain.Money() instanceof NumberValidator);
		assert.ok(firstNumber instanceof NumberValidator);
		assert.ok(secondNumber instanceof NumberValidator);
		assert.notStrictEqual(firstNumber, secondNumber);
		assert.ok(domain.String() instanceof StringValidator);
	});

	test("Testing Domain.create with a static Label", () => {
		const domain = Domain.create({create: NumberValidator});

		assert.ok(domain.create() instanceof NumberValidator);
	});

	test("Testing Domain.create with invalid Labels", () => {
		assert.throws(() => {
			Domain.create({extend: NumberValidator});
		}, (error) => {
			assert.ok(error instanceof TypeError);
			assert.equal(error.message, "Invalid Label extend detected");

			return true;
		});

		assert.throws(() => {
			Domain.create({toString: NumberValidator});
		}, (error) => {
			assert.ok(error instanceof TypeError);
			assert.equal(error.message, "Invalid Label toString detected");

			return true;
		});
	});

	test("Testing Domain.create with invalid Types", () => {
		assert.throws(() => {
			Domain.create({never: NeverValidator});
		}, (error) => {
			assert.ok(error instanceof TypeError);
			assert.equal(error.message, "Invalid Type never detected");

			return true;
		});
	});

	test("Testing Domain.create with duplicate Types", () => {
		assert.throws(() => {
			Domain.create({
				Number: NumberValidator,
				DuplicateNumber: DuplicateNumberValidator
			});
		}, (error) => {
			assert.ok(error instanceof TypeError);
			assert.equal(error.message, "Type number is already registered by another Validator Class");

			return true;
		});
	});

	test("Testing Domain.extend", () => {
		const domain = Domain.create({Value: NumberValidator});
		const extended = domain.extend({
			String: StringValidator,
			Value: StringValidator
		});

		assert.ok(domain.Value() instanceof NumberValidator);
		assert.ok(extended.String() instanceof StringValidator);
		assert.ok(extended.Value() instanceof StringValidator);
	});

	test("Testing Domain Core Validator Builders", () => {
		const domain = Domain.create({});
		const never = domain.Never();
		const unknown = domain.Unknown();
		const intersect = domain.Intersect([never, unknown]);
		const union = domain.Union([never, unknown]);

		assert.ok(never instanceof NeverValidator);
		assert.ok(unknown instanceof UnknownValidator);
		assert.ok(intersect instanceof IntersectValidator);
		assert.deepStrictEqual(intersect.constraints.variants, [never, unknown]);
		assert.ok(union instanceof UnionValidator);
		assert.deepStrictEqual(union.constraints.variants, [never, unknown]);
	});

	test("Testing Domain.fromJSON with invalid Definitions", () => {
		const domain = Domain.create({});

		for (const definition of [null, [], "unknown"]) {
			assert.throws(() => {
				domain.fromJSON(definition, "schema");
			}, (error) => {
				assert.ok(error instanceof DefinitionError);
				assert.equal(error.message, "Expected schema to be an Object");
				assert.equal(error.path, "schema");

				return true;
			});
		}

		for (const definition of [{}, {type: null}]) {
			assert.throws(() => {
				domain.fromJSON(definition, "schema");
			}, (error) => {
				assert.ok(error instanceof DefinitionError);
				assert.equal(error.message, "Expected schema.type to be a String");
				assert.equal(error.path, "schema.type");

				return true;
			});
		}
	});

	test("Testing Domain.fromJSON with an unknown Validator", () => {
		assert.throws(() => {
			Domain.create({}).fromJSON({type: "missing"}, "schema");
		}, (error) => {
			assert.ok(error instanceof DefinitionError);
			assert.equal(error.message, "Validator at schema not found");
			assert.equal(error.path, "schema");

			return true;
		});
	});

	test("Testing Domain.fromJSON with Core Validators", () => {
		const domain = Domain.create({});

		assert.ok(domain.fromJSON({type: "never"}) instanceof NeverValidator);
		assert.ok(domain.fromJSON({type: "unknown"}) instanceof UnknownValidator);

		const intersect = domain.fromJSON({
			type: "intersect",
			variants: [
				{type: "never"},
				{type: "unknown"}
			]
		});
		const union = domain.fromJSON({
			type: "union",
			variants: [
				{type: "never"},
				{type: "unknown"}
			]
		});

		assert.ok(intersect instanceof IntersectValidator);
		assert.ok(intersect.constraints.variants[0] instanceof NeverValidator);
		assert.ok(intersect.constraints.variants[1] instanceof UnknownValidator);
		assert.ok(union instanceof UnionValidator);
		assert.ok(union.constraints.variants[0] instanceof NeverValidator);
		assert.ok(union.constraints.variants[1] instanceof UnknownValidator);
	});

	test("Testing Domain.fromJSON with registered Validators", () => {
		const domain = Domain.create({Number: NumberValidator});
		const number = domain.fromJSON({type: "number", min: 1}, "schema");
		const union = domain.fromJSON({
			type: "union",
			variants: [
				{type: "number", integer: true},
				{type: "unknown"}
			]
		}, "schema");

		assert.ok(number instanceof NumberValidator);
		assert.equal(number.constraints.min, 1);
		assert.ok(union instanceof UnionValidator);
		assert.ok(union.constraints.variants[0] instanceof NumberValidator);
		assert.ok(union.constraints.variants[1] instanceof UnknownValidator);
	});

	test("Testing Domain.fromJSON forwards the Path", () => {
		assert.throws(() => {
			Domain.create({Number: NumberValidator}).fromJSON({
				type: "number",
				min: "invalid"
			}, "schema");
		}, (error) => {
			assert.ok(error instanceof AggregateError);
			assert.equal(error.errors.length, 1);
			assert.ok(error.errors[0] instanceof DefinitionError);
			assert.equal(error.errors[0].message, "Expected schema.min to be a finite Number");
			assert.equal(error.errors[0].path, "schema.min");

			return true;
		});
	});
});
