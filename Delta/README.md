# Delta

Deeply nested JSON operations with a simple, safe, path-based API.

- Path type with integers and strings: numbers index arrays, strings access object keys
- Insert, read, check, and delete without mutating your input
- Supports negative, out-of-bounds, and fractional indices for ergonomic array edits
- Typed with @serum-enterprises/json and error-safe via @serum-enterprises/result

## Installation

```bash
npm install --save @serum-enterprises/delta
```

## Example Usage

```typescript
import {Delta} from './Delta';
import {JSON} from '@serum-enterprises/json';

const data: JSON = { name: {firstname: "Joe", lastname: "Doe"}, age: 20, friends: ["Alice", "Bob"] };

// Update Firstname and Age
Delta.applyMany(data, [
  [["name", "firstname"], "Jane"],
  [["age"], 21]
])
        // Output the Result<JSON, Error> on their respective consoles
        .match(console.log, console.error);

// Modify the Friends Array
Delta.applyMany(data, [
  // Replace the first Friend with Joe (Results in ["Joe", "Bob"])
  [["friends", 0], "Joe"],
  // Prepend a new Friend (Results in ["Sara", "Joe", "Bob"])
  [["friends", -1], "Sara"],
  // Insert a Friend between Sara and Joe (Results in ["Sara", "Alice", "Joe", "Bob"])
  [["friends", 0.5], "Alice"],
  // Remove Bob from the Array (Results in ["Sara", "Alice", "Joe"])
  [["friends", 3]]
])
        // Output the Result<JSON, Error> on their respective consoles
        .match(console.log, console.error);
```

### Paths & Deltas

```typescript
type Path = (number | string)[];
type Delta = [Path] | [Path, JSON];
```

Where `[Path]` is a delete Operation and `[Path, JSON]` is an insert Operation.

- number → array index
- string → object key
- negative number → prepend (e.g., -1 inserts before index 0)
- out-of-bounds number → append
- fractional number → insert between elements (e.g., 0.5 between 0 and 1)

### Errors

All operations are error-safe and return Result<JSON, Error>:

- NotFoundError
  - OutOfBoundsError (arrays)
  - KeyNotFoundError (objects)
- InvalidPathError (mismatched key type in path)
- TypeMismatchError (encountered non-array/object mid-path)

Use Result.match to handle success and failure without exceptions.

## API

Please check [Delta.d.ts](./types/Delta.d.ts) for the full API, including:

- Delta.atomicSet(target, path, value): Result<JSON, Error>
- Delta.atomicGet(target, path): Result<JSON, Error>
- Delta.atomicHas(target, path): boolean
- Delta.atomicRemove(target, path, compress?): Result<JSON, Error>
- Delta.apply(target, delta, compress?): Result<JSON, Error>
- Delta.applyMany(target, deltas, compress?): Result<JSON, Error>
- Path helpers: Path.isPath, Path.equals, Path.toString

## Related

- @serum-enterprises/json — canonical JSON types and utilities
- @serum-enterprises/result — Result type used for error-safe operations

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