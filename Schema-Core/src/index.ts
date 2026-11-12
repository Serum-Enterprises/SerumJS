export {AssertError, DefinitionError} from "./lib/errors";

export {Validator, type ValidatorDefinition} from "./validators/Validator";

export {Domain, type ValidatorClass} from "./Domain";

export {NeverValidator} from "./validators/core/NeverValidator";
export {UnknownValidator} from "./validators/core/UnknownValidator";
export {IntersectValidator} from "./validators/core/IntersectValidator";
export {UnionValidator} from "./validators/core/UnionValidator";

import {NullValidator} from "./validators/json/NullValidator";
import {BooleanValidator} from "./validators/json/BooleanValidator";
import {NumberValidator} from "./validators/json/NumberValidator";
import {StringValidator} from "./validators/json/StringValidator";
import {ArrayValidator} from "./validators/json/ArrayValidator";
import {ObjectValidator} from "./validators/json/ObjectValidator";

export {
	ArrayValidator,
	BooleanValidator,
	NullValidator,
	NumberValidator,
	ObjectValidator,
	StringValidator
};

export const JSONValidators = Object.freeze({
	Array: ArrayValidator,
	Boolean: BooleanValidator,
	Null: NullValidator,
	Number: NumberValidator,
	Object: ObjectValidator,
	String: StringValidator
});
