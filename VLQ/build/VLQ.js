"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NegativeIntegerError = exports.IncompleteSequenceError = exports.EmptyBufferError = exports.VLQError = void 0;
exports.encodeUnsignedInteger = encodeUnsignedInteger;
exports.decodeUnsignedInteger = decodeUnsignedInteger;
exports.encodeInteger = encodeInteger;
exports.decodeInteger = decodeInteger;
const result_1 = require("@serum-enterprises/result");
class VLQError extends Error {
}
exports.VLQError = VLQError;
class EmptyBufferError extends VLQError {
}
exports.EmptyBufferError = EmptyBufferError;
class IncompleteSequenceError extends VLQError {
}
exports.IncompleteSequenceError = IncompleteSequenceError;
class NegativeIntegerError extends VLQError {
}
exports.NegativeIntegerError = NegativeIntegerError;
function encodeUnsignedInteger(value) {
    if (value < 0n)
        return result_1.Result.Err(new NegativeIntegerError('Expected value to be a positive Integer'));
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
    return result_1.Result.Ok(Buffer.from(bytes));
}
function decodeUnsignedInteger(buffer, includeLength = false) {
    if (buffer.length === 0)
        return result_1.Result.Err(new EmptyBufferError('Buffer is empty'));
    let value = 0n;
    let byteLength = 0;
    let byte = 0;
    do {
        byte = buffer[byteLength];
        value = (value << 7n) | BigInt(byte & 0x7F);
        byteLength++;
    } while (byteLength < buffer.length && (byte & 0x80));
    if (byteLength === buffer.length && (byte & 0x80))
        return result_1.Result.Err(new IncompleteSequenceError('Incomplete VLQ Sequence'));
    return result_1.Result.Ok(includeLength ? { value, byteLength } : value);
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
    return result_1.Result.Ok(Buffer.from(bytes));
}
function decodeInteger(buffer, includeLength = false) {
    if (buffer.length === 0)
        return result_1.Result.Err(new EmptyBufferError('Buffer is empty'));
    let result = 0n;
    let byteLength = 0;
    let byte = buffer[byteLength];
    const isNegative = !!(byte & 0x40);
    result = BigInt(byte & 0x3F);
    byteLength++;
    while (byteLength < buffer.length && (byte & 0x80)) {
        byte = buffer[byteLength];
        result = (result << 7n) | BigInt(byte & 0x7F);
        byteLength++;
    }
    if (byteLength === buffer.length && (byte & 0x80))
        return result_1.Result.Err(new IncompleteSequenceError('Incomplete VLQ Sequence'));
    const value = isNegative ? -result : result;
    return result_1.Result.Ok(includeLength ? { value, byteLength } : value);
}
