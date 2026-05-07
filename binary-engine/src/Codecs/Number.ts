import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
import { TagByte, TYPE, CustomEncoder, CustomDecoder, BufferTooSmallError, InvalidNumberSizeError } from '../Codec';

export namespace NumberCodec {
	export function encode(value: JSON.Number, _encoder: CustomEncoder): Result<Buffer, never> {
		if (Number.isSafeInteger(value)) {
			if (value >= -128 && value <= 127) {
				const buffer = Buffer.alloc(2);
				buffer[0] = TYPE.INT | 0x03;
				buffer.writeInt8(value, 1);
				return Result.Ok(buffer);
			}
			else if (value >= -32768 && value <= 32767) {
				const buffer = Buffer.alloc(3);
				buffer[0] = TYPE.INT | 0x04;
				buffer.writeInt16LE(value, 1);
				return Result.Ok(buffer);
			}
			else if (value >= -2147483648 && value <= 2147483647) {
				const buffer = Buffer.alloc(5);
				buffer[0] = TYPE.INT | 0x05;
				buffer.writeInt32LE(value, 1);
				return Result.Ok(buffer);
			}
			else {
				const buffer = Buffer.alloc(9);
				buffer[0] = TYPE.INT | 0x06;
				buffer.writeBigInt64LE(BigInt(value), 1);
				return Result.Ok(buffer);
			}
		}
		else {
			if (Math.fround(value) === value) {
				const buffer = Buffer.alloc(5);
				buffer[0] = TYPE.FLOAT | 0x05;
				buffer.writeFloatLE(value, 1);
				return Result.Ok(buffer);
			}
			else {
				const buffer = Buffer.alloc(9);
				buffer[0] = TYPE.FLOAT | 0x06;
				buffer.writeDoubleLE(value, 1);
				return Result.Ok(buffer);
			}
		}
	}

	export function decode(tag: TagByte & ({ type: TYPE.INT } | { type: TYPE.FLOAT }), buffer: Buffer, _decoder: CustomDecoder): Result<[Buffer, JSON.Number], Error> {
		switch (tag.type) {
			case TYPE.INT:
				switch (tag.data) {
					case 3:
						if (buffer.byteLength < 1)
							return Result.Err(new BufferTooSmallError('Expected buffer to at least of length 1'));

						return Result.Ok([buffer.subarray(1), buffer.readInt8()]);
					case 4:
						if (buffer.byteLength < 2)
							return Result.Err(new BufferTooSmallError('Expected buffer to at least of length 2'));

						return Result.Ok([buffer.subarray(2), buffer.readInt16LE()]);
					case 5:
						if (buffer.byteLength < 4)
							return Result.Err(new BufferTooSmallError('Expected buffer to at least of length 4'));

						return Result.Ok([buffer.subarray(4), buffer.readInt32LE()]);
					case 6:
						if (buffer.byteLength < 8)
							return Result.Err(new BufferTooSmallError('Expected buffer to at least of length 8'));

						return Result.Ok([buffer.subarray(8), Number(buffer.readBigInt64LE())]);
					default:
						return Result.Err(new InvalidNumberSizeError(`Expected TagByte data Section to contain 3, 4, 5 or 6, got: ${tag.data}`));
				}
			case TYPE.FLOAT:
				switch (tag.data) {
					case 5:
						if (buffer.length < 4)
							return Result.Err(new BufferTooSmallError('Buffer too small for float'));

						return Result.Ok([buffer.subarray(4), buffer.readFloatLE()]);
					case 6:
						if (buffer.length < 8)
							return Result.Err(new BufferTooSmallError('Buffer too small for double'));

						return Result.Ok([buffer.subarray(8), buffer.readDoubleLE()]);
					default:
						return Result.Err(new InvalidNumberSizeError('Expected 32 or 64 Bit Float type'));
				}
		}
	}
}
