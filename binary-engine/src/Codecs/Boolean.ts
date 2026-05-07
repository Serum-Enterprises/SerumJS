import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';
import { TagByte, TYPE, CustomEncoder, CustomDecoder } from '../Codec';

export namespace BooleanCodec {
	export function encode(value: JSON.Boolean, _encoder: CustomEncoder): Result<Buffer, never> {
		return Result.Ok(Buffer.from([TYPE.BOOL | +value]));
	}

	export function decode(tag: TagByte & { type: TYPE.BOOL }, buffer: Buffer, _decoder: CustomDecoder): Result<[Buffer, JSON.Boolean], never> {
		return Result.Ok([buffer, !!tag.data]);
	}
}