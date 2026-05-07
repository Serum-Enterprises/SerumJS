# Serum Binary JSON Encoding (SBJE)

The Serum Binary JSON Encoding as an Encoding for JSON-like Data Structures developed by Serum Enterprises for its Binary Engine Project.

## Document Layout

An SBJE Document is encoded similarly to MessagePack, but utilizing a slightly different type system. SBJE Documents are self describing.

### Tag Byte
A Tag Byte is used to identify the DataType of a Value. It is also the first Byte of the Document. A Tag Byte consists of 8 Bits, divided into the following Sections:

```
[4 Bits: Type][1 Bit: Pointer Flag][3 Bits: Optional Data]
```

## Types

### `Null - 0x00`

A Null Value is encoded as a single Tag Byte with the first 4 Bits set to `0b0000`. The Pointer Bit and Data Bits SHOULD BE set to `0`, but should be ignored by the Decoder.

### `Boolean - 0x10`

A Boolean Value is encoded as a single Tag Byte with the first 4 Bits set to `0b0001`. The Pointer Bit is ignored, and the Data Bits are used to represent the Boolean Value. The Data Bits SHOULD BE set to `0b0000` for `false`, and `0b0001` for `true`, although any non-zero value is considered `true`.

### `Number - 0x20 | 0x30`

Numbers in JS are always represented as 64 Bit Floats, but SBJE supports both Integer and Float Types and utilizes Packing to reduce the Size. For packing, the 3 Data Bits are used as the exponent to determine the Bit-Size of the Number.

#### `Integer - 0x20`

Integer Values can be stored as 8, 16, 32, or 64 Bit Signed Integers. The Tag Byte is set to `0b0010` and the Data Bits are used to determine the Bit-Size of the Integer. Following is a table of supported values in JS:

| Data Bits (Binary) | Data Bits (Decimal) | Formula | Bit-Size | Byte-Size |
| ------------------ | ------------------- | ------- | -------- | --------- |
| `0b011`            | 3                   | 2 ** 3  | 8        | 1         |
| `0b100`            | 4                   | 2 ** 4  | 16       | 2         |
| `0b101`            | 5                   | 2 ** 5  | 32       | 4         |
| `0b110`            | 6                   | 2 ** 6  | 64       | 8         |

Theoretically this would also support 2, 4 and 128 Bit Integers, but as these are not supported by JavaScript, they are not included in the table. Every Decoder MUST return an Error if the Bit-Size is not supported.

Note that with JS, only Integers up to 53 Bits can be represented accurately, so the maximum Bit-Size for Integers in JS is 53 Bits. These get stored in 64 Bit Integer. Integers that are not representable accurately will be stored as 64 Bit Floats.

The Integer HAS TO follow the Tag Byte immediately, and is represented in a Little-Endian Format.

#### `Float - 0x30`

The Same as for Integers, but with the Tag Byte set to `0b0011`. The Data Bits are used to determine the Bit-Size of the Float. Following is a table of the possible values:

| Data Bits (Binary) | Data Bits (Decimal) | Formula | Bit-Size | Byte-Size |
| ------------------ | ------------------- | ------- | -------- | --------- |
| `0b011`            | 3                   | 2 ** 3  | 32       | 4         |
| `0b100`            | 4                   | 2 ** 4  | 64       | 8         |

Theoretically this would also support 2, 4, 8, 16 and 128 Bit Floats, but as these are not supported by JavaScript, they are not included in the table. Every Decoder MUST return an Error if the Bit-Size is not supported.

The Float HAS TO follow the Tag Byte immediately, and is represented in the Little Endian IEEE 754 Floating Point Representation.

### `UTF8 String - 0x40`

A UTF8 String is encoded as a Tag Byte with the first 4 Bits set to `0b0100`. If the Data Bits are in the range of `0b000` to `0b110`, they encode the length of the String in Bytes (up to 6 Bytes). If the Data Bits are set to `0b111`, the Tag Byte is followed by an unsigned VLQ-encoded Integer, followed by the UTF8 String Data. The String Data is encoded in UTF8 and MUST be valid UTF8.

### `Array - 0x50`

An Array is encoded as a Tag Byte with the first 4 Bits set to `0b0101`. The Tag Byte is followed by the Array Length in Bytes (as an unsigned VLQ-encoded Integer) and the Array Data. An Array Size of `0` indicates an empty Array. The Array Data is encoded as a Sequence of Values, each Value being encoded as a Tag Byte followed by the Value Data. The Values in the Array can be of any Type, including other Arrays or Objects.

### `Object - 0x60`

An Object is encoded as a Tag Byte with the first 4 Bits set to `0b0110`. The Tag Byte is followed by the Object Size in Bytes (as an unsigned VLQ-encoded Integer), which is the total size of all Key-Value Pairs in the Object. An Object Size of `0` indicates an empty Object. The Object Data is encoded as a Sequence of Key-Value Pairs, each Key being a UTF8 String and each Value being encoded as a Tag Byte followed by the Value Data. The Keys in the Object MUST be unique. Duplicate Keys are undefined behavior but usually result in the last Key-Value Pair being kept. The Keys are encoded as UTF8 Strings, and the Values can be of any Type, including other Objects or Arrays.

### `Extension Types - 0x70 to 0xF0`

The Tag Bytes from `0x70` to `0xF0` are reserved for Extension Types. These are custom Types that can be defined by the user or by a specific application. The first 4 Bits of the Tag Byte are used to identify the Extension Type, while the Pointer Bit and Data Bits can be used to provide additional information about the Extension Type. The exact format and meaning of the Extension Types is application-specific and should be documented by the application that uses them.

## Custom Encoders and Decoders

Custom Encoders and Decoders can be implemented to support additional Types or to optimize the encoding and decoding process for specific use cases. The SBJE specification allows for custom Types to be defined using the Extension Types, and custom Encoders and Decoders can be implemented to handle these Types.

When implementing a custom Encoder or Decoder, it is important to ensure that it adheres to the SBJE specification. If a Custom Encoder or Decoder do not modify their Parameters, their result will be handled by the Default Encoder or Decoder.

Custom Encoders and Decoders will be called recursively while parsing the Document, so they can handle nested Structures and Types. They can also be used to optimize the encoding and decoding process for specific Types or Structures.

### Custom Encoder

A Custom Encoder takes the following Form:

```ts
(value: unknown) => Result<Buffer | unknown, Error>
```

If the Result is not a Buffer, it will be handled by the Default Encoder. If the Result is a Buffer, it will be returned as the encoded Value.

### Custom Decoder
A Custom Decoder takes the following Form:

```ts
(tag: TagByte, buffer: Buffer) => Result<[Buffer, unknown] | Buffer, Error>
```

If the Result is a Buffer, it will be handled by the Default Decoder. If the Result is a Tuple with the remaining Buffer and a Value, the Value will be returned as the decoded Value, and the Buffer will be used to continue decoding the Document.

## Example custom Encoder and Decoder
```ts
function customEncoder(value: unknown): Result<Buffer | unknown, Error> {
	if (typeof value === 'bigint') {
		// Custom Type for BigInt
		const tagByte = Buffer.from([0x70]);
		VLQ.encode()

		return Ok(Buffer.concat([tagByte, buffer]));
	}

	return Err(new Error('Unsupported type for custom encoding'));
}