# Path

Deeply Nested Data Structure Operations with JSON Paths

## Installation

```bash
npm install --save @serum-enterprises/path
```

## Usage

This Library provides 4 simple functions to manipulate deeply nested JSON using Paths (an Array of Integers and Strings).

The `get`, `set` and `remove` functions return Result Objects ([@serum-enterprises/result on NPM](https://www.npmjs.com/package/@serum-enterprises/result)) while `has` returns a boolean.

**Note** that all functions are immutable and do not modify the original data but rather return a deep clone of the data with the changes applied.

```typescript
import * as Path from '@serum-enterprises/path';

const data = { name: { first: 'John', last: 'Doe' }, age: 20, friends: [{ name: "Maria", age: 22 }] };

Path.set(data, ['friends', -2, 'name'], 'Mark');
// Returns Result.Ok({ name: { first: 'John', last: 'Doe' }, age: 20, friends: [{ name: "Mark" }, null, { name: "Maria", age: 22 }] })

Path.get(data, ['name', 'first']);
// Returns Result.Ok('John')

Path.has(data, ['name', 'first']);
// Returns true

Path.remove(data, ['friends', 0]);
// Returns Result.Ok({ name: { first: 'John', last: 'Doe' }, age: 20, friends: [] })
```

## API

Please check [Path.d.ts](./types/Path.d.ts) for the full API.

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