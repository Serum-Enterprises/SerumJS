import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
import { TagByte, TYPE, CustomEncoder, CustomDecoder } from '../Codec';

export namespace NullCodec {
	export function encode(_value: JSON.Null, _encoder: CustomEncoder): Result<Buffer, never> {
		return Result.Ok(Buffer.from([TYPE.NULL]));
	}

	export function decode(_tag: TagByte & { type: TYPE.NULL }, buffer: Buffer, _decoder: CustomDecoder): Result<[Buffer, JSON.Null], never> {
		return Result.Ok([buffer, null]);
	}
}