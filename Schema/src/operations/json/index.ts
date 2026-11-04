import {ArrayOperations} from "./ArrayOperations";
import {BooleanOperations} from "./BooleanOperations";
import {NullOperations} from "./NullOperations";
import {NumberOperations} from "./NumberOperations";
import {ObjectOperations} from "./ObjectOperations";
import {StringOperations} from "./StringOperations";

export {
	ArrayOperations,
	mergeArray,
	normalizeArray
} from "./ArrayOperations";

export {
	BooleanOperations,
	mergeBoolean,
	normalizeBoolean
} from "./BooleanOperations";

export {
	NullOperations,
	mergeNull,
	normalizeNull
} from "./NullOperations";

export {
	NumberOperations,
	mergeNumber,
	normalizeNumber
} from "./NumberOperations";

export {
	ObjectOperations,
	mergeObject,
	normalizeObject
} from "./ObjectOperations";

export {
	StringOperations,
	mergeString,
	normalizeString
} from "./StringOperations";

export const Operations = [
	NullOperations,
	BooleanOperations,
	NumberOperations,
	StringOperations,
	ArrayOperations,
	ObjectOperations
] as const;
