import {IntersectOperations} from "./IntersectOperations";
import {NeverOperations} from "./NeverOperations";
import {UnionOperations} from "./UnionOperations";
import {UnknownOperations} from "./UnknownOperations";

export {
	IntersectOperations,
	normalizeIntersect
} from "./IntersectOperations";

export {
	NeverOperations,
	mergeNever,
	normalizeNever
} from "./NeverOperations";

export {
	UnionOperations,
	mergeUnion,
	normalizeUnion
} from "./UnionOperations";

export {
	UnknownOperations,
	mergeUnknown,
	normalizeUnknown
} from "./UnknownOperations";

export const Operations = [
	NeverOperations,
	UnknownOperations,
	IntersectOperations,
	UnionOperations
] as const;
