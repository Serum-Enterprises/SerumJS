import * as VLQ from '@serum-enterprises/vlq';
import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
import { TagByte, TYPE, CustomEncoder, CustomDecoder, BufferTooSmallError } from '../Codec';
import { Codec } from '../Codec';

export namespace ArrayCodec {
	export function encode(value: JSON.Array, encoder: CustomEncoder): Result<Buffer, VLQ.VLQError | AggregateError> {
		const bufferResult = Result.all(value.map(value => Codec.encode(value, encoder)))
			.mapOk(buffers => Buffer.concat(buffers));

		return bufferResult
			.match<Result<Buffer, VLQ.VLQError | AggregateError>>(
				buffer => {
					return VLQ.encodeUnsignedInteger(BigInt(buffer.byteLength))
						.match<Result<Buffer, VLQ.VLQError>>(
							length => Result.Ok(Buffer.concat([Buffer.from([TYPE.ARRAY]), length, buffer])),
							error => Result.Err(error)
						);
				},
				error => Result.Err(new AggregateError(error))
			);
	}

	export function decode(_tag: TagByte & { type: TYPE.ARRAY }, buffer: Buffer, decoder: CustomDecoder): Result<[Buffer, unknown[]], Error> {
		return VLQ.decodeUnsignedInteger(buffer, true).match(
			({ value: length, byteLength }) => {
				if (buffer.length < (byteLength + Number(length)))
					return Result.Err(new BufferTooSmallError('Buffer too small for array data'));

				const elements: unknown[] = [];
				let remaining = buffer.subarray(byteLength, byteLength + Number(length));

				while (remaining.length > 0) {
					const decodeResult = Codec.decode(remaining, decoder);

					if (!decodeResult.isOk())
						return decodeResult as Result<never, Error>;

					const [nextRemaining, element] = decodeResult.value;
					elements.push(element);
					remaining = nextRemaining;
				}

				return Result.Ok([buffer.subarray(byteLength + Number(length)), elements]);
			},
			error => Result.Err(error)
		);
	}
}