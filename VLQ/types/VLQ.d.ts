export declare function encodeUnsignedInteger(value: bigint): Buffer;
export declare function decodeUnsignedInteger(buffer: Buffer, includeLength: false): bigint;
export declare function decodeUnsignedInteger(buffer: Buffer, includeLength: true): {
    value: bigint;
    byteLength: bigint;
};
export declare function encodeInteger(value: bigint): Buffer;
export declare function decodeInteger(buffer: Buffer, includeLength: false): bigint;
export declare function decodeInteger(buffer: Buffer, includeLength: true): {
    value: bigint;
    byteLength: bigint;
};
