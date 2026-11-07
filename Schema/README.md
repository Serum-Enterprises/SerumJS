# Schema

A flexible Schema System for validating Data.

## Installation

```bash
npm install @serum-enterprises/schema
```

## Domain

The Domain Class is the main registration point for Validators, Codecs and Operations.

## Validators

This package includes the four Core Validators (`Never`, `Unknown`, `Intersect`, `Union`) as well as six JSON Validators (`Null`,
`Boolean`, `Number`, `String`, `Array`, `Object`).

## Codecs

For converting Validators from and to JSON, this packages offers Codecs for each of the above-mentioned Validators.

## Operations

The following Operations are available by default: `normalize`, `merge`, `isEquals` and `isSubset`.

## Example (with Schema-JSON)

```typescript
import {Domain} from '@serum-enterprises/schema';
import * as JSONSchema from '@serum-enterprises/schema-json';

// Create a Domain with the JSON Plugin
const Schema = Domain.create({
	JSON: JSONSchema.Registry
}, [
	JSONSchema.Operations
]);

const schema = Schema.JSON.Object.shape({
	name: Schema.JSON.String,
	age: Schema.JSON.Number.integer().min(18).max(99),
	friends: Schema.JSON.Array.every(Schema.JSON.String)
}).exact();

const person = schema.validate({name: 'John', age: 20, friends: ["Jane", "Mary"]});

console.log(person.name);
console.log(person.age);
console.log(person.friends.join(', '));
```

## Features

- **Extensible**: Register custom validators and operations through the Domain system.
- **Composable**: Build complex schemas using logical operations like `Union` and `Intersect`.
- **Plugin-based**: Keep your bundle small by only including the validators you need.

## Plugin Libraries

- [`@serum-enterprises/schema-json`](../Schema-JSON): Validators for standard JSON types (String, Number, Object, Array,
  etc.).

## LICENSE

MIT License

Copyright (c) 2025 Serum Enterprises L.L.C-FZ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.