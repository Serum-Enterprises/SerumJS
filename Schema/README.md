# Schema Framework

A flexible Schema Framework for building validation libraries. 

This library provides the core infrastructure for schema validation, including base classes, error handling, and logical operations (Union, Intersect, etc.). To use it for actual data validation (like JSON, Strings, Numbers), you should use a plugin library like `@serum-enterprises/schema-json`.

## Installation

```bash
npm install @serum-enterprises/schema
```

You will likely also want a plugin:

```bash
npm install @serum-enterprises/schema-json
```

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

- [`@serum-enterprises/schema-json`](../Schema-JSON): Validators for standard JSON types (String, Number, Object, Array, etc.).

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