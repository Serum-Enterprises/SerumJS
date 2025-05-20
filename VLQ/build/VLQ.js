"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeUnsignedInteger = encodeUnsignedInteger;
exports.decodeUnsignedInteger = decodeUnsignedInteger;
exports.encodeInteger = encodeInteger;
exports.decodeInteger = decodeInteger;
function encodeUnsignedInteger(value) {
    if (value < 0n)
        throw new RangeError('Expected value to be a positive Integer');
    const bytes = [];
    let byte = Number(value & 0x7fn);
    value >>= 7n;
    bytes.push(byte);
    while (value > 0) {
        byte = Number(value & 0x7fn);
        byte |= 0x80;
        value >>= 7n;
        bytes.unshift(byte);
    }
    return Buffer.from(bytes);
}
function decodeUnsignedInteger(buffer, includeLength = false) {
    if (buffer.length === 0)
        throw new RangeError('Buffer is empty');
    let value = 0n;
    let i = 0;
    let byte = 0;
    do {
        byte = buffer[i];
        value = (value << 7n) | BigInt(byte & 0x7F);
        i++;
    } while (i < buffer.length && (byte & 0x80));
    if (i === buffer.length && (byte & 0x80))
        throw new RangeError('Incomplete VLQ Sequence');
    return includeLength ? { value, byteLength: BigInt(i) } : value;
}
function encodeInteger(value) {
    const isNegative = value < 0n;
    const negativeMask = isNegative ? 0x40 : 0x00;
    let abs = isNegative ? -value : value;
    const bytes = [];
    let byte = Number(abs & 0x7fn);
    abs >>= 7n;
    bytes.push(byte);
    while (abs > 0n) {
        byte = Number(abs & 0x7fn) | 0x80;
        abs >>= 7n;
        bytes.unshift(byte);
    }
    if (bytes[0] & 0x40)
        bytes.unshift(0x80 | negativeMask);
    else
        bytes[0] |= negativeMask;
    return Buffer.from(bytes);
}
function decodeInteger(buffer, includeLength = false) {
    if (buffer.length === 0)
        throw new RangeError('Buffer is empty');
    let result = 0n;
    let i = 0;
    let byte = buffer[i];
    const isNegative = !!(byte & 0x40);
    result = BigInt(byte & 0x3F);
    i++;
    while (i < buffer.length && (byte & 0x80)) {
        byte = buffer[i];
        result = (result << 7n) | BigInt(byte & 0x7F);
        i++;
    }
    if (i === buffer.length && (byte & 0x80))
        throw new RangeError('Incomplete VLQ Sequence');
    const value = isNegative ? -result : result;
    return includeLength ? { value, byteLength: BigInt(i) } : value;
}
