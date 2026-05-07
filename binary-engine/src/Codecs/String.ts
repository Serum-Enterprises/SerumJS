import * as VLQ from '@serum-enterprises/vlq';
import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
import { TagByte, TYPE, CustomEncoder, CustomDecoder, BufferTooSmallError } from '../Codec';

export namespace StringCodec {
	export function encode(value: JSON.String, _encoder: CustomEncoder): Result<Buffer, VLQ.VLQError> {
		const buffer = Buffer.from(value, 'utf8');

		if (buffer.length <= 6)
			return Result.Ok(Buffer.concat([Buffer.from([TYPE.UTF8 | buffer.length]), buffer]));

		const lengthResult = VLQ.encodeUnsignedInteger(BigInt(buffer.byteLength));

		return lengthResult.mapOk(
			length => Buffer.concat([Buffer.from([TYPE.UTF8 | 0x07]), length, buffer])
		);
	}

	export function decode(tag: TagByte & { type: TYPE.UTF8 }, buffer: Buffer, _decoder: CustomDecoder): Result<[Buffer, JSON.String], Error> {
		if (tag.data <= 6) {
			if (buffer.length < tag.data)
				return Result.Err(new BufferTooSmallError('Buffer too small for string data'));

			return Result.Ok([buffer.subarray(tag.data), buffer.toString('utf8', 0, tag.data)]);
		}

		const lengthResult = VLQ.decodeUnsignedInteger(buffer, true);

		return lengthResult.match(
			({ value: length, byteLength }) => {
				if (buffer.length < length)
					return Result.Err(new BufferTooSmallError('Buffer too small for string data'));

				return Result.Ok([
					buffer.subarray(byteLength + Number(length)),
					buffer.toString('utf8', byteLength, byteLength + Number(length))
				]);
			},
			error => {
				return Result.Err(error);
			}
		);
	}
}