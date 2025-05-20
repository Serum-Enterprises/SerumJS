# Variable Length Quantity (VLQ) Encoding

A VLQ Implementation for NodeJS using BigInts and Buffers

## Installation

```bash
npm install --save @serum-enterprises/vlq
```

## Usage

```typescript
import * as VLQ from '@serum-enterprises/vlq';

const unsignedInteger = 1234567890123456789012345678901234567890n;
const signedInteger = -1234567890123456789012345678901234567890n;
let unsignedDecoded: bigint;
let signedDecoded: bigint;
let byteLength: bigint;

const unsignedEncoded = VLQ.encodeUnsignedInteger(unsignedInteger);
unsignedDecoded = VLQ.decodeUnsignedInteger(unsignedEncoded);

assert(unsignedDecoded === unsignedInteger);

{unsignedDecoded, byteLength} = VLQ.decodeUnsignedInteger(unsignedEncoded);

assert(unsignedDecoded === unsignedInteger);
assert(byteLength === BigInt(unsignedEncoded.length));

const signedEncoded = VLQ.encodeSignedInteger(signedInteger);
signedDecoded = VLQ.decodeSignedInteger(signedEncoded);

assert(signedDecoded === signedInteger);

{signedDecoded, byteLength} = VLQ.decodeSignedInteger(signedEncoded);

assert(signedDecoded === signedInteger);
assert(byteLength === BigInt(signedEncoded.length));
```

## API

Please check [VLQ.d.ts](./types/VLQ.d.ts) for the full API.

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