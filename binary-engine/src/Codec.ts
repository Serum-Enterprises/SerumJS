import { Result } from '@serum-enterprises/result';
import * as JSON from '@serum-enterprises/json';

import { NullCodec } from './Codecs/Null';
import { BooleanCodec } from './Codecs/Boolean';
import { NumberCodec } from './Codecs/Number';
import { StringCodec } from './Codecs/String';
import { ArrayCodec } from './Codecs/Array';
import { ObjectCodec } from './Codecs/Object';

export namespace TYPE {
	export const NULL = 0x00;
	export type NULL = number & 0x00;
	export const BOOL = 0x10;
	export type BOOL = number & 0x10;
	export const INT = 0x20;
	export type INT = number & 0x20;
	export const FLOAT = 0x30;
	export type FLOAT = number & 0x30;
	export const UTF8 = 0x40;
	export type UTF8 = number & 0x40;
	export const ARRAY = 0x50;
	export type ARRAY = number & 0x50;
	export const OBJECT = 0x60;
	export type OBJECT = number & 0x60;
}

export type CustomEncoder = (value: unknown) => Result<Buffer | unknown, Error>;
export type CustomDecoder = (tag: TagByte, buffer: Buffer) => Result<[Buffer, unknown] | Buffer, Error>;

export interface TagByte {
	type: number;
	flag: boolean;
	data: number;
}

export namespace TagByte {
	export function fromByte(byte: number): TagByte {
		return { type: byte & 0xF0, flag: !!(byte & 0x08), data: byte & 0x07 };
	}

	export function fromBuffer(buffer: Buffer): TagByte {
		return TagByte.fromByte(buffer[0] || 0x00);
	}

	export function toByte(tag: TagByte): number {
		return tag.type | +tag.flag | tag.data;
	}

	export function toBuffer(tag: TagByte): Buffer {
		return Buffer.from([TagByte.toByte(tag)]);
	}
}

export abstract class CodecError extends Error { }
export class UnsupportedTypeError extends CodecError { }

export abstract class EncodeError extends CodecError { }
export class CustomEncodeError extends EncodeError { }

export abstract class DecodeError extends CodecError { }
export class CustomDecodeError extends DecodeError { }
export class InvalidBufferSizeError extends DecodeError { }
export class EmptyBufferError extends DecodeError { }
export class BufferTooSmallError extends DecodeError { }
export class InvalidNumberSizeError extends DecodeError { }
export class InvalidObjectKeyError extends DecodeError { }

export class Codec {
	public static encode(value: unknown, encoder: CustomEncoder = (value) => Result.Ok(value)): Result<Buffer, Error> {
		let encoderResult: Result<Buffer | unknown, Error>;

		try {
			encoderResult = encoder(value);
		}
		catch (error) {
			return Result.Err(new CustomEncodeError(`Custom Encoder failed`, { cause: error }));
		}

		return encoderResult.match(
			result => {
				if (Buffer.isBuffer(result))
					return Result.Ok(result);
				else {
					if (JSON.isNull(value))
						return NullCodec.encode(value, encoder);
					else if (JSON.isBoolean(value))
						return BooleanCodec.encode(value, encoder);
					else if (JSON.isNumber(value))
						return NumberCodec.encode(value, encoder);
					else if (JSON.isString(value))
						return StringCodec.encode(value, encoder);
					else if (JSON.isArray(value))
						return ArrayCodec.encode(value, encoder);
					else if (JSON.isObject(value))
						return ObjectCodec.encode(value, encoder);
					else
						return Result.Err(new UnsupportedTypeError('Built-In Codec only supports valid JSON Types'));
				}
			},
			error => Result.Err(new CustomEncodeError(`Custom Encoder failed`, { cause: error }))
		);
	}

	public static decode(buffer: Buffer, decoder: CustomDecoder = (_tag, buffer) => Result.Ok(buffer)): Result<[Buffer, unknown], Error> {
		if (buffer.length === 0)
			throw new EmptyBufferError('Buffer is empty');

		const tag = TagByte.fromByte(buffer[0]!);
		let decoderResult: Result<[Buffer, unknown] | Buffer, Error>;

		try {
			decoderResult = decoder(tag, buffer.subarray(1));
		}
		catch (error) {
			return Result.Err(new CustomDecodeError(`Custom Decoder failed`, { cause: error }));
		}

		return decoderResult.match(
			result => {
				if (!Buffer.isBuffer(result)) {
					return Result.Ok(result);
				}
				else {
					switch (tag.type) {
						case TYPE.NULL:
							return NullCodec.decode(tag as TagByte & { type: TYPE.NULL }, buffer.subarray(1), decoder);
						case TYPE.BOOL:
							return BooleanCodec.decode(tag as TagByte & { type: TYPE.BOOL }, buffer.subarray(1), decoder);
						case TYPE.INT:
						case TYPE.FLOAT:
							return NumberCodec.decode(tag as TagByte & ({ type: TYPE.INT } | { type: TYPE.FLOAT }), buffer.subarray(1), decoder);
						case TYPE.UTF8:
							return StringCodec.decode(tag as TagByte & { type: TYPE.UTF8 }, buffer.subarray(1), decoder);
						case TYPE.ARRAY:
							return ArrayCodec.decode(tag as TagByte & { type: TYPE.ARRAY }, buffer.subarray(1), decoder);
						case TYPE.OBJECT:
							return ObjectCodec.decode(tag as TagByte & { type: TYPE.OBJECT }, buffer.subarray(1), decoder);
						default:
							return Result.Err(new UnsupportedTypeError('Built-In Codec only supports valid JSON Types'));
					}
				}
			},
			error => Result.Err(new CustomDecodeError(`Custom Decoder failed`, { cause: error }))
		);
	}
}

