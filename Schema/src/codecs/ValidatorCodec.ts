import type {Domain} from "../Domain";
import type {Validator} from "../validators/Validator";

export interface ValidatorDefinition {
	type: string;
}

export interface ValidatorCodec<
	DEFINITION extends ValidatorDefinition,
	VALIDATOR extends Validator
> {
	fromJSON(
		definition: {type: DEFINITION["type"]} & Record<string, unknown>,
		path: string,
		domain: Domain
	): VALIDATOR;

	toJSON(
		validator: VALIDATOR,
		domain: Domain
	): DEFINITION;
}
