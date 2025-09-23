# JSON

Type-Safe drop-in replacement for the native JSON

## Installation

```bash
npm install --save @serum-enterprises/json
```

## Usage

```typescript
import {JSON} from '@serum-enterprises/json';

const data: JSON = { name: 'John Doe', age: 25 };
const name: JSON.String = data.name;

function verify(data: JSON): boolean {
	if(!JSON.isObject(data))
		return false;

	if(!JSON.isString(data.name) || !JSON.isInteger(data.age))
		return false;

	return true;
}

if(verify(data)) {
	console.log(`Data for ${name} is correct: `);
	console.log(JSON.stringify(data, null, 2));
}
```

## API

Please check [JSON.d.ts](./types/JSON.d.ts) for the full API.

Please also note that functions prefixed with `_` are potentially mutating their Input.

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