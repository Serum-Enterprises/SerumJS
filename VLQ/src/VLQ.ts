import { Result } from '@serum-enterprises/result';

export abstract class VLQError extends Error { }
export class EmptyBufferError extends VLQError { }
export class IncompleteSequenceError extends VLQError { }
export class NegativeIntegerError extends VLQError { }

export function encodeUnsignedInteger(value: bigint): Result<Buffer, Error> {
	if (value < 0n)
		return Result.Err(new NegativeIntegerError('Expected value to be a positive Integer'));

	const bytes: number[] = [];

	let byte = Number(value & 0x7Fn);

	value >>= 7n;
	bytes.push(byte);

	while (value > 0) {
		byte = Number(value & 0x7Fn);
		byte |= 0x80;
		value >>= 7n;
		bytes.unshift(byte);
	}

	return Result.Ok(Buffer.from(bytes));
}

export function decodeUnsignedInteger(buffer: Buffer, includeLength: false): Result<bigint, Error>;
export function decodeUnsignedInteger(buffer: Buffer, includeLength: true): Result<{ value: bigint, byteLength: number }, Error>;
export function decodeUnsignedInteger(buffer: Buffer, includeLength: boolean = false): Result<bigint | { value: bigint, byteLength: number }, Error> {
	if (buffer.length === 0)
		return Result.Err(new EmptyBufferError('Buffer is empty'));

	let value = 0n;
	let byteLength = 0;
	let byte = 0;

	do {
		byte = buffer[byteLength]!;
		value = (value << 7n) | BigInt(byte & 0x7F);
		byteLength++;
	} while (byteLength < buffer.length && (byte & 0x80));

	if (byteLength === buffer.length && (byte & 0x80))
		return Result.Err(new IncompleteSequenceError('Incomplete VLQ Sequence'));

	return Result.Ok(includeLength ? { value, byteLength } : value);
}

export function encodeInteger(value: bigint): Result<Buffer, Error> {
	const isNegative = value < 0n;
	const negativeMask = isNegative ? 0x40 : 0x00;
	let abs = isNegative ? -value : value;
	const bytes: number[] = [];

	let byte = Number(abs & 0x7Fn);

	abs >>= 7n;
	bytes.push(byte);

	while (abs > 0n) {
		byte = Number(abs & 0x7Fn) | 0x80;
		abs >>= 7n;
		bytes.unshift(byte);
	}

	if (bytes[0]! & 0x40)
		bytes.unshift(0x80 | negativeMask);
	else
		bytes[0]! |= negativeMask;

	return Result.Ok(Buffer.from(bytes));
}

export function decodeInteger(buffer: Buffer, includeLength: false): Result<bigint, Error>;
export function decodeInteger(buffer: Buffer, includeLength: true): Result<{ value: bigint, byteLength: number }, Error>;
export function decodeInteger(buffer: Buffer, includeLength: boolean = false): Result<bigint | { value: bigint, byteLength: number }, Error> {
	if (buffer.length === 0)
		return Result.Err(new EmptyBufferError('Buffer is empty'));

	let result = 0n;
	let byteLength = 0;
	let byte = buffer[byteLength]!;

	const isNegative = !!(byte & 0x40);
	result = BigInt(byte & 0x3F);
	byteLength++;

	while (byteLength < buffer.length && (byte & 0x80)) {
		byte = buffer[byteLength]!;
		result = (result << 7n) | BigInt(byte & 0x7F);
		byteLength++;
	}

	if (byteLength === buffer.length && (byte & 0x80))
		return Result.Err(new IncompleteSequenceError('Incomplete VLQ Sequence'));

	const value = isNegative ? -result : result;

	return Result.Ok(includeLength ? { value, byteLength } : value);
}