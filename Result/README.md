# Result

Rust-like Result for TS/JS Projects

## Installation

```bash
npm install --save @serum-enterprises/result
```

## Usage

```typescript
import { Result } from '@serum-enterprises/result';

function divide(a: number, b: number): Result<number, RangeError> {
	if (b === 0)
		return Result.Err(new RangeError(`Cannot divide by Zero`));

	return Result.Ok(a / b);
}

Result.attempt<[number, number], SyntaxError>(() => JSON.parse('[10, 0]'))
	.match<Result<number, RangeError | SyntaxError>>(
		([a, b]) => divide(a, b),
		error => Result.Err(error)
	)
	.match(
		value => console.log(`Result: ${value}`),
		error => console.error(`Error: ${error.message}`)
	);
```

## API

Please check [Result.d.ts](./types/Result.d.ts) for the full API.

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