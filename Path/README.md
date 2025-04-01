# Path

Deeply Nested Data Structure Operations with JSON Paths

## Installation

```bash
npm install --save @serum-enterprises/path
```

## Usage

This Library provides two main Types: `Path` and `Context`.

A Path is an Array of Integers and Strings that represents a location in a deeply nested data structure. It can be used to access, modify, or remove values from the data structure.

Paths are used by instances of `Context`, which is a wrapper around a JSON Data Structure, who provide methods for manipulating the Data inside the Context. The JSON Data Structure has to be modeled around [@serum-enterprises/json](https://www.npmjs.com/package/@serum-enterprises/json).

There are 4 main operations available in the Context:
- `get`: Get the value at the specified path.
- `set`: Set the value at the specified path.
- `remove`: Remove the value at the specified path.
- `has`: Check if the value at the specified path exists.

All of those operations are available as non-atomic, mutating static methods, or as atomic instance methods that modify the Context in place.

To make the static methods atomic and immutable, the given target data for `set` and `remove` as well as the return value of `get` should be deeply cloned. The [@serum-enterprises/json](https://www.npmjs.com/package/@serum-enterprises/json) can be used for that purpose. It is also used internally by the Context, therefore installing it has no additional cost.

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