export {NullValidator, NullValidatorDefinition} from "./Null";
export {JSONValidator, JSONValidatorDefinition} from "./JSON";
export {BooleanValidator, BooleanValidatorDefinition} from "./Boolean";
export {NumberValidator, NumberValidatorDefinition} from "./Number";
export {StringValidator, StringValidatorDefinition} from "./String";
export {ArrayValidator, ArrayValidatorDefinition} from "./Array";
export {ObjectValidator, ObjectValidatorDefinition} from "./Object";

import {NullValidator} from "./Null";
import {BooleanValidator} from "./Boolean";
import {NumberValidator} from "./Number";
import {StringValidator} from "./String";
import {ArrayValidator} from "./Array";
import {ObjectValidator} from "./Object";
import {JSONValidator} from "./JSON";

export const JSON = {
	"Null": NullValidator,
	"Boolean": BooleanValidator,
	"Number": NumberValidator,
	"String": StringValidator,
	"Array": ArrayValidator,
	"Object": ObjectValidator,
	"JSON": JSONValidator
};