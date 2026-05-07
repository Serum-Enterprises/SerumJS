import * as VLQ from '@serum-enterprises/vlq';
import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
import { TagByte, TYPE, CustomEncoder, CustomDecoder, BufferTooSmallError, InvalidObjectKeyError } from '../Codec';
import { Codec } from '../Codec';

export namespace ObjectCodec {
	export function encode(value: JSON.Object, encoder: CustomEncoder): Result<Buffer, VLQ.VLQError | Error> {
		const bufferResult = Result.all(
			Object.entries(value).reduce((acc, [key, val]) => {
				return [...acc, Codec.encode(key, encoder), Codec.encode(val, encoder)];
			}, [] as Result<Buffer, Error>[])
		).mapOk(buffers => Buffer.concat(buffers));

		return bufferResult
			.match<Result<Buffer, VLQ.VLQError | Error>>(
				buffer => {
					return VLQ.encodeUnsignedInteger(BigInt(buffer.byteLength))
						.match<Result<Buffer, VLQ.VLQError | Error>>(
							length => Result.Ok(Buffer.concat([Buffer.from([TYPE.OBJECT]), length, buffer])),
							error => Result.Err(error)
						);
				},
				error => Result.Err(new AggregateError(error))
			);
	}

	export function decode(_tag: TagByte & { type: TYPE.OBJECT }, buffer: Buffer, decoder: CustomDecoder): Result<[Buffer, { [key: string]: unknown }], Error> {
		return VLQ.decodeUnsignedInteger(buffer, true).match(
			({ value: length, byteLength }) => {
				const end = byteLength + Number(length);

				if (buffer.length < end)
					return Result.Err(new BufferTooSmallError('Buffer too small for object data'));

				const obj: { [key: string]: unknown } = {};
				let remaining = buffer.subarray(byteLength, end);

				while (remaining.length > 0) {
					const stringDecodeResult = Codec.decode(remaining, decoder)

					if (!stringDecodeResult.isOk())
						return stringDecodeResult as Result<never, Error>;

					const [nextRemaining, key] = stringDecodeResult.value;

					if (!JSON.isString(key))
						return Result.Err(new InvalidObjectKeyError('Expected an Object Key to be a String'));

					const valueDecodeResult = Codec.decode(nextRemaining, decoder);

					if (!valueDecodeResult.isOk())
						return valueDecodeResult as Result<never, Error>;

					const [nextNextRemaining, value] = valueDecodeResult.value;
					obj[key] = value;
					remaining = nextNextRemaining;
				}

				return Result.Ok([buffer.subarray(end), obj]);
			},
			error => Result.Err(error)
		);
	}
}
