"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panic = panic;
function panic(message, errorCode = 1) {
    const stack = new Error().stack?.split('\n').slice(2).join('\n');
    process.stderr.write(message);
    if (stack) {
        process.stderr.write(stack);
    }
    process.exit(errorCode);
}
