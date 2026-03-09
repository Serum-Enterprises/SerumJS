import { Result } from '@serum-enterprises/result';
export declare abstract class VLQError extends Error {
}
export declare class EmptyBufferError extends VLQError {
}
export declare class IncompleteSequenceError extends VLQError {
}
export declare class NegativeIntegerError extends VLQError {
}
export declare function encodeUnsignedInteger(value: bigint): Result<Buffer, Error>;
export declare function decodeUnsignedInteger(buffer: Buffer, includeLength: false): Result<bigint, Error>;
export declare function decodeUnsignedInteger(buffer: Buffer, includeLength: true): Result<{
    value: bigint;
    byteLength: number;
}, Error>;
export declare function encodeInteger(value: bigint): Result<Buffer, Error>;
export declare function decodeInteger(buffer: Buffer, includeLength: false): Result<bigint, Error>;
export declare function decodeInteger(buffer: Buffer, includeLength: true): Result<{
    value: bigint;
    byteLength: number;
}, Error>;
