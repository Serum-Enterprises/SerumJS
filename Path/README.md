# Result

Deeply nested Data Structure Operations with Paths

## Installation

```bash
npm install --save @serum-enterprises/path
```

## Usage

```typescript
import * as Path from '@serum-enterprises/path';

const data = { name: { first: 'John', last: 'Doe' }, age: 20, friends: [{ name: "Maria", age: 22 }] };

Path.set(data, ['name', 'first'], 'Jane');
// data === { name: { first: 'Jane', last: 'Doe' }, age: 20, friends: [{ name: "Maria", age: 22 }] }
Path.set(data, ['friends', -1, 'name'], 'Mark');
// data === { name: { first: 'Jane', last: 'Doe' }, age: 20, friends: [{ name: "Mark" }, { name: "Maria", age: 22 }] }

Path.get(data, ['name', 'first']);
// Jane

Path.has(data, ['name', 'first']);
// True

Path.remove(data, ['friends', 0]);
// data === { name: { first: 'Jane', last: 'Doe' }, age: 20, friends: [{ name: "Maria", age: 22 }] }
```

**Note: This Library mutates passed Data! If this is unwanted, use @serum-enterprises/json to clone the Data first!**
**Note: Path.set and Path.get return Result<JSON.JSON, Error>. See @serum-enterprises/result for more Information.**

## API

Please check [Path.d.ts](./types/Path.d.ts) for the full API.

## LICENSE

MIT License

Copyright (c) [2025] [Serum Enterprises L.L.C-FZ]

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