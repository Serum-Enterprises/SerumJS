# Schema Core

The foundation of the SerumJS Schema System. `@serum-enterprises/schema-core` provides immutable, type-safe validators, composable unions and intersections, JSON serialization, and an extensible validator domain.

## Installation

```bash
npm install @serum-enterprises/schema-core
```

Schema Core requires Node.js 24 or newer.

## Quick start

Create a domain with all built-in JSON validator classes:

```typescript
import {
	Domain,
	JSONValidators
} from "@serum-enterprises/schema-core";

const Schema = Domain.create(JSONValidators);

const Person = Schema.Object()
	.shape({
		name: Schema.String().min(1),
		age: Schema.Number().integer().min(18),
		active: Schema.Boolean()
	})
	.exact();

const person = Person.validate({
	name: "Jane",
	age: 32,
	active: true
});

console.log(person.name);
```

The return type of `validate()` is inferred from the validator. In this example, `person` is typed as an object containing `name`, `age`, and `active`.

## Validating values

Every validator provides three ways to validate an unknown value:

### `validate()`

Returns the value with its inferred type or throws when validation fails.

```typescript
const Name = Schema.String().min(1);
const name = Name.validate(input, "user.name");
```

The optional path defaults to `"value"` and is included in validation errors.

### `test()`

Returns a boolean and acts as a TypeScript type guard.

```typescript
const Enabled = Schema.Boolean();

if (Enabled.test(input)) {
	console.log(input ? "enabled" : "disabled");
}
```

### `assert()`

Throws when validation fails and narrows the original variable when it succeeds.

```typescript
const Count = Schema.Number().integer().min(0);

Count.assert(input, "count");
console.log(input.toFixed(0));
```

## Immutable constraints

Validators are immutable. Constraint methods return a new validator and leave the original unchanged.

```typescript
const String = Schema.String();
const ShortString = String.min(1).max(20);

String.validate("");
ShortString.validate("Hello");
```

Literal constraints are reflected in inferred types where applicable. For example, `Schema.String().equals("ready")` validates and returns the literal type `"ready"`.

## Built-in validators

### Core validators

Core validators are always available on every domain.

| Domain method | Validator | Description |
| --- | --- | --- |
| `Never()` | `NeverValidator` | Rejects every value. |
| `Unknown()` | `UnknownValidator` | Accepts every value. |
| `Intersect(variants)` | `IntersectValidator` | Requires every variant to accept the value. |
| `Union(variants)` | `UnionValidator` | Requires at least one variant to accept the value. |

Unions and intersections require at least one variant:

```typescript
const Schema = Domain.create(JSONValidators);

const Identifier = Schema.Union([
	Schema.String().min(1),
	Schema.Number().integer()
]);

const BoundedInteger = Schema.Intersect([
	Schema.Number().integer(),
	Schema.Number().min(0).max(100)
]);
```

### JSON validators

`JSONValidators` contains all six JSON validator classes under their standard labels. Pass it to `Domain.create()` to register the complete set, or instantiate the individual classes directly.

| Validator | Constraint methods | Result |
| --- | --- | --- |
| `NullValidator` | none | `null` |
| `BooleanValidator` | `equals(value)` | `boolean`, or the constrained boolean literal |
| `NumberValidator` | `integer()`, `min(value)`, `max(value)`, `equals(value)` | `number`, or the constrained number literal |
| `StringValidator` | `min(length)`, `max(length)`, `equals(value)` | `string`, or the constrained string literal |
| `ArrayValidator` | `min(length)`, `max(length)`, `every(validator)`, `tuple(validators)` | An array inferred from its element constraints |
| `ObjectValidator` | `min(size)`, `max(size)`, `every(validator)`, `shape(shape)`, `exact()` | An object inferred from its property constraints |

`integer()` accepts safe integers. `min()` and `max()` describe values for numbers and collection sizes for strings, arrays, and objects.

### Arrays

`every()` validates every array element. `tuple()` applies validators to the leading elements and allows additional elements. When both constraints are present, both apply.

```typescript
const Coordinates = Schema.Array()
	.every(Schema.Number())
	.tuple([
		Schema.Number().min(-90).max(90),
		Schema.Number().min(-180).max(180)
	]);

const coordinates = Coordinates.validate([51.5, -0.12]);
```

### Objects

`shape()` requires every declared property and infers its type. Additional properties are accepted unless `exact()` is enabled. `every()` validates every accepted property value.

```typescript
const Settings = Schema.Object()
	.shape({
		theme: Schema.String().equals("dark"),
		notifications: Schema.Boolean()
	})
	.exact();

const settings = Settings.validate({
	theme: "dark",
	notifications: true
});
```

## Domains

A domain registers validator classes and exposes factory methods with inferred return types. The registration label becomes the method name.

```typescript
const Schema = Domain.create({
	Text: JSONValidators.String,
	Integer: JSONValidators.Number
});

const title = Schema.Text().min(1);
const count = Schema.Integer().integer();
```

Labels must not conflict with existing domain properties. Validator types must be unique within a domain. The reserved types `never`, `unknown`, `intersect`, and `union` are provided by the domain and cannot be registered.

Use `extend()` to create a new domain with additional or replaced registrations. The original domain remains unchanged.

```typescript
const JSONSchema = Domain.create(JSONValidators);

const ExtendedSchema = JSONSchema.extend({
	Text: JSONValidators.String
});
```

## JSON definitions

Every validator can be converted to a JSON-compatible definition with `toJSON()`:

```typescript
const Schema = Domain.create(JSONValidators);

const Identifier = Schema.Union([
	Schema.String().min(1),
	Schema.Number().integer()
]);

console.log(Identifier.toJSON());
// {
//   type: "union",
//   variants: [
//     {type: "string", min: 1},
//     {type: "number", integer: true}
//   ]
// }
```

Use the same domain to reconstruct a validator with `fromJSON()`:

```typescript
const RestoredIdentifier = Schema.fromJSON({
	type: "union",
	variants: [
		{type: "string", min: 1},
		{type: "number", integer: true}
	]
});

RestoredIdentifier.validate("user-123");
```

`fromJSON()` validates the complete definition, rejects unknown properties, and uses definition paths such as `definition.variants[0].min` when reporting errors.

## Errors

Runtime validation failures throw `AssertError` or an `AggregateError` containing nested validation failures. Invalid JSON definitions throw `DefinitionError` or an `AggregateError` containing definition failures.

Both `AssertError` and `DefinitionError` expose the failing `path`:

```typescript
import {
	AssertError,
	Domain,
	JSONValidators
} from "@serum-enterprises/schema-core";

const Schema = Domain.create(JSONValidators);

try {
	Schema.Number().integer().validate(1.5, "order.quantity");
} catch (error) {
	if (error instanceof AssertError) {
		console.error(error.path);
		console.error(error.message);
	}
}
```

Composite validators and structured values collect independent failures in `AggregateError.errors`, allowing callers to report multiple invalid fields or variants at once.

## Extending Schema Core

Custom validators extend `Validator`, declare a unique static `type`, implement runtime assertion and JSON serialization, and provide a static `fromJSON()` factory.

```typescript
import {
	AssertError,
	DefinitionError,
	Domain,
	Validator,
	type ValidatorDefinition
} from "@serum-enterprises/schema-core";

class DateValidator extends Validator<Date> {
	public static readonly type = "date";

	public static fromJSON(
		definition: ValidatorDefinition<"date">,
		path: string,
		_domain: Domain
	): DateValidator {
		for (const key of Object.keys(definition)) {
			if (key !== "type") {
				throw new DefinitionError(
					`Unknown property ${path}.${key}`,
					`${path}.${key}`
				);
			}
		}

		return new DateValidator({});
	}

	public constructor(
		_constraints: Readonly<Record<string, never>>
	) {
		super();
	}

	public assert(value: unknown, path = "value"): asserts value is Date {
		if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
			throw new AssertError(`Expected ${path} to be a valid Date`, path);
		}
	}

	public toJSON(): {type: "date"} {
		return {type: "date"};
	}
}

const Schema = Domain.create({Date: DateValidator});

Schema.Date().validate(new Date());
Schema.fromJSON({type: "date"}).validate(new Date());
```

The constructor must accept an empty constraint object so the domain can create a default validator. `fromJSON()` is responsible for validating serialized constraints and reconstructing the validator with the supplied domain.

## License

[MIT](./LICENSE) © 2026 Serum Enterprises L.L.C-FZ
