# Option

Rust-like Option for TS/JS Projects

## Installation

```bash
npm install --save @serum-enterprises/option
```

## Usage

```typescript
import { Option } from '@serum-enterprises/option';

function find<T>(array: T[], element: T): Option<T> {
	const result = array.find(value => value === element);

	if(result === undefined)
		return Option.None();

	return Option.Some(result);
}

find([1, 2, 3], 2).match(
	value => console.log(`Found: ${value}`),
	() => console.error(`Element not found`);
);
```

## API

Please check [Option.d.ts](./types/Option.d.ts) for the full API.

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