import * as JSON from '@serum-enterprises/json';
import { Result } from '@serum-enterprises/result';

export class SchemaError extends Error { }
export class ValidationError extends Error { }

export abstract class Schema {
	static get Any() {
		return new AnyValidator();
	}

	static get Boolean() {
		return new BooleanValidator();
	}

	static get Number() {
		return new NumberValidator();
	}

	static get String() {
		return new StringValidator();
	}

	static get Array() {
		return new ArrayValidator();
	}

	static get Object() {
		return new ObjectValidator();
	}

	static get Or() {
		return new OrValidator();
	}

	static get And() {
		return new AndValidator();
	}

	static get defaultRegistry(): Map<string, typeof Schema> {
		return new Map<string, typeof Schema>([
			['any', AnyValidator],
			['boolean', BooleanValidator],
			['number', NumberValidator],
			['string', StringValidator],
			['array', ArrayValidator],
			['object', ObjectValidator],
			['or', OrValidator],
			['and', AndValidator]
		]);
	}

	static fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<Schema, SchemaError> {
		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if (!JSON.isString(schema['type']))
			return Result.Err(new SchemaError(`Expected ${path}.type to be a String`));

		if (!registry.has(schema['type']))
			return Result.Err(new SchemaError(`Expected ${path}.type to be a registered Validator`));

		return (registry.get(schema['type']) as typeof Schema).fromJSON(schema, path, registry);
	}

	abstract validate(data: unknown, path?: string): Result<void, ValidationError>;

	abstract toJSON(): JSON.Object;
}

class AnyValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<AnyValidator, SchemaError> {
		const validator = new AnyValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		return Result.Ok(validator);
	}

	constructor() {
		super();
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (!JSON.isJSON(data))
			return Result.Err(new ValidationError(`Expected ${path} to be JSON`));

		return Result.Ok(void 0);
	}

	toJSON(): JSON.Object {
		return {
			type: 'any'
		};
	}
}

class BooleanValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<BooleanValidator, SchemaError> {
		const validator = new BooleanValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			validator.nullable(schema['nullable']);
		}

		if ('equals' in schema) {
			if (!JSON.isBoolean(schema['equals']))
				return Result.Err(new SchemaError(`Expected ${path}.equals to be a Boolean`));

			validator.equals(schema['equals']);
		}

		return Result.Ok(validator);
	}

	#nullable: { flag: boolean };
	#equals: { flag: boolean; value: JSON.Boolean; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#equals = { flag: false, value: false };
	}

	nullable(flag: boolean): this {
		this.#nullable = { flag };

		return this;
	}

	equals(value: boolean): this {
		this.#equals = { flag: true, value };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (JSON.isBoolean(data)) {
			if (this.#equals.flag && this.#equals.value !== data)
				return Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}${this.#nullable.flag ? '' : ' or Null'}`));

			return Result.Ok(void 0);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(void 0);

		return Result.Err(new ValidationError(`Expected ${path} to be a Boolean${this.#nullable.flag ? '' : ' or Null'}`));
	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'boolean'
		};

		if (this.#nullable.flag)
			schema['nullable'] = this.#nullable.flag;

		if (this.#equals.flag)
			schema['equals'] = this.#equals.value;

		return schema;
	}
}

class NumberValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<NumberValidator, SchemaError> {
		const validator = new NumberValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			validator.nullable(schema['nullable']);
		}

		if ('equals' in schema) {
			if (!JSON.isNumber(schema['equals']))
				return Result.Err(new SchemaError(`Expected ${path}.equals to be a Number`));

			validator.equals(schema['equals']);
		}

		if ('integer' in schema) {
			if (!JSON.isBoolean(schema['integer']))
				return Result.Err(new SchemaError(`Expected ${path}.integer to be a Boolean`));

			validator.integer(schema['integer']);
		}

		if ('min' in schema) {
			if (!JSON.isNumber(schema['min']))
				return Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));

			validator.min(schema['min']);
		}

		if ('max' in schema) {
			if (!JSON.isNumber(schema['max']))
				return Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));

			validator.max(schema['max']);
		}

		return Result.Ok(validator);
	}

	#nullable: { flag: boolean };
	#equals: { flag: boolean; value: JSON.Number; };
	#integer: { flag: boolean; };
	#min: { flag: boolean; value: JSON.Number; };
	#max: { flag: boolean; value: JSON.Number; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#equals = { flag: false, value: 0 };
		this.#integer = { flag: false };
		this.#min = { flag: false, value: 0 };
		this.#max = { flag: false, value: 0 };
	}

	nullable(flag: boolean): this {
		this.#nullable = { flag };

		return this;
	}

	equals(value: number): this {
		this.#equals = { flag: true, value };

		return this;
	}

	integer(flag: boolean = true): this {
		this.#integer = { flag };

		return this;
	}

	min(value: number): this {
		this.#min = { flag: true, value };

		return this;
	}

	max(value: number): this {
		this.#max = { flag: true, value };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (JSON.isNumber(data)) {
			if (this.#equals.flag && this.#equals.value !== data)
				return Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}`));

			if (this.#integer.flag && !Number.isInteger(data))
				return Result.Err(new ValidationError(`Expected ${path} to be an Integer`));

			if (this.#min.flag && this.#min.value > data)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value}`));

			if (this.#max.flag && this.#max.value < data)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value}`));

			return Result.Ok(void 0);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(void 0);

		return Result.Err(new ValidationError(`Expected ${path} to be a Number${this.#nullable.flag ? '' : ' or Null'}`));
	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'number'
		};

		if (this.#nullable.flag)
			schema['nullable'] = this.#nullable.flag;

		if (this.#equals.flag)
			schema['equals'] = this.#equals.value;

		if (this.#integer.flag)
			schema['integer'] = this.#integer.flag;

		if (this.#min.flag)
			schema['min'] = this.#min.value;

		if (this.#max.flag)
			schema['max'] = this.#max.value;

		return schema;
	}
}

class StringValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<StringValidator, SchemaError> {
		const validator = new StringValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			validator.nullable(schema['nullable']);
		}

		if ('equals' in schema) {
			if (!JSON.isString(schema['equals']))
				return Result.Err(new SchemaError(`Expected ${path}.equals to be a String`));

			validator.equals(schema['equals']);
		}

		if ('min' in schema) {
			if (!JSON.isNumber(schema['min']))
				return Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));

			validator.min(schema['min']);
		}

		if ('max' in schema) {
			if (!JSON.isNumber(schema['max']))
				return Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));

			validator.max(schema['max']);
		}

		return Result.Ok(validator);
	}

	#nullable: { flag: boolean };
	#equals: { flag: boolean; value: JSON.String; };
	#min: { flag: boolean; value: JSON.Number; };
	#max: { flag: boolean; value: JSON.Number; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#equals = { flag: false, value: "" };
		this.#min = { flag: false, value: 0 };
		this.#max = { flag: false, value: 0 };
	}

	nullable(flag: boolean): this {
		this.#nullable = { flag };

		return this;
	}

	equals(value: string): this {
		this.#equals = { flag: true, value };

		return this;
	}

	min(value: number): this {
		this.#min = { flag: true, value };

		return this;
	}

	max(value: number): this {
		this.#max = { flag: true, value };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (JSON.isString(data)) {
			if (this.#equals.flag && this.#equals.value !== data)
				return Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}`));

			if (this.#min.flag && this.#min.value > data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} characters long`));

			if (this.#max.flag && this.#max.value < data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} characters long`));

			return Result.Ok(void 0);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(void 0);

		return Result.Err(new ValidationError(`Expected ${path} to be a String${this.#nullable.flag ? '' : ' or Null'}`));

	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'string'
		};

		if (this.#nullable.flag)
			schema['nullable'] = this.#nullable.flag;

		if (this.#equals.flag)
			schema['equals'] = this.#equals.value;

		if (this.#min.flag)
			schema['min'] = this.#min.value;

		if (this.#max.flag)
			schema['max'] = this.#max.value;

		return schema;
	}
}

class ArrayValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<ArrayValidator, SchemaError> {
		const validator = new ArrayValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			validator.nullable(schema['nullable']);
		}

		if ('min' in schema) {
			if (!JSON.isNumber(schema['min']))
				return Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));

			validator.min(schema['min']);
		}

		if ('max' in schema) {
			if (!JSON.isNumber(schema['max']))
				return Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));

			validator.max(schema['max']);
		}

		if ('every' in schema) {
			if (!JSON.isObject(schema['every']))
				return Result.Err(new SchemaError(`Expected ${path}.every to be an Object`));

			const itemValidator: Result<Schema, SchemaError> = Schema.fromJSON(schema['every'], `${path}.every`, registry);

			if (itemValidator.isOk())
				validator.every(itemValidator.value);

			if (itemValidator.isErr())
				return itemValidator;
		}

		if ('tuple' in schema) {
			if (!JSON.isArray(schema['tuple']))
				return Result.Err(new SchemaError(`Expected ${path}.tuple to be an Array`));

			const validatorResults: [{ [key: string]: Schema }, { [key: string]: SchemaError }] = [{}, {}];

			for (let i = 0; i < schema['tuple'].length; i++) {
				const value = schema['tuple'][i] as JSON.JSON;

				if (!JSON.isObject(value))
					validatorResults[1][i] = new SchemaError(`Expected ${path}.tuple[${i}] to be an Object`);

				Schema.fromJSON(value, `${path}.tuple[${i}]`, registry).match(
					value => { validatorResults[0][i] = value },
					error => { validatorResults[1][i] = error }
				);
			}

			if (Object.keys(validatorResults[1]).length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.tuple to be an Array where every Element is a valid Schema`, { cause: validatorResults[1] }));

			validator.tuple(Object.entries(validatorResults[0]).map(([_, value]) => value));
		}

		return Result.Ok(validator);
	}

	#nullable: { flag: boolean };
	#every: { flag: boolean; validator: Schema; };
	#min: { flag: boolean; value: number; };
	#max: { flag: boolean; value: number; };
	#tuple: { flag: boolean; value: Schema[]; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#every = { flag: false, validator: new AnyValidator() };
		this.#min = { flag: false, value: 0 };
		this.#max = { flag: false, value: 0 };
		this.#tuple = { flag: false, value: [] };
	}

	nullable(flag: boolean = true): this {
		this.#nullable = { flag };

		return this;
	}

	min(value: number): this {
		this.#min = { flag: true, value };

		return this;
	}

	max(value: number): this {
		this.#max = { flag: true, value };

		return this;
	}

	every(validator: Schema): this {
		this.#every = { flag: true, validator };

		return this;
	}

	tuple(validators: Schema[]): this {
		this.#tuple = { flag: true, value: validators };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (JSON.isArray(data)) {
			if (this.#min.flag && this.#min.value > data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} Elements long`));

			if (this.#max.flag && this.#max.value < data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} Elements long`));

			if (this.#every.flag) {
				const errors: ValidationError[] = data
					.map((value, index) => this.#every.validator.validate(value, `${path}[${index}]`))
					.filter(value => value.isErr())
					.map(value => value.error);

				if (errors.length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be an Array where every Element matches the item Validator`, { cause: errors }));
			}

			if (this.#tuple.flag) {
				if (this.#tuple.value.length !== data.length)
					return Result.Err(new ValidationError(`Expected ${path} to have exactly ${this.#tuple.value.length} Elements`));

				const errors: ValidationError[] = this.#tuple.value
					.map((validator, index) => validator.validate(data[index], `${path}[${index}]`))
					.filter(value => value.isErr())
					.map(value => value.error);

				if (errors.length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be a Tuple where every Element matches its respective Validator`, { cause: errors }));
			}

			return Result.Ok(void 0);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(void 0);

		return Result.Err(new ValidationError(`Expected ${path} to be an Array${this.#nullable.flag ? '' : ' or Null'}`));
	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'array'
		};

		if (this.#nullable.flag)
			schema['nullable'] = this.#nullable.flag;

		if (this.#min.flag)
			schema['min'] = this.#min.value;

		if (this.#max.flag)
			schema['max'] = this.#max.value;

		if (this.#every.flag)
			schema['every'] = this.#every.validator.toJSON();

		if (this.#tuple.flag)
			schema['tuple'] = this.#tuple.value.map(validator => validator.toJSON());

		return schema;
	}
}

class ObjectValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<ObjectValidator, SchemaError> {
		const validator = new ObjectValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			validator.nullable(schema['nullable']);
		}

		if ('schema' in schema) {
			if (!JSON.isObject(schema['schema']))
				return Result.Err(new SchemaError(`Expected ${path}.schema to be an Object`));

			const validatorResults: [{ [key: string]: Schema }, { [key: string]: SchemaError }] = [{}, {}];

			for (let [key, value] of Object.entries(schema['schema'])) {
				if (!JSON.isObject(value))
					validatorResults[1][key] = new SchemaError(`Expected ${path}.schema.${key} to be an Object`);

				Schema.fromJSON(value, path, registry).match(
					value => { validatorResults[0][key] = value },
					error => { validatorResults[1][key] = error }
				);
			}

			if (Object.keys(validatorResults[1]).length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.schema to be an Object where every Property is a valid Schema`, { cause: validatorResults[1] }));

			validator.schema(validatorResults[0]);
		}

		if ('inclusive' in schema) {
			if (!JSON.isBoolean(schema['inclusive']))
				return Result.Err(new SchemaError(`Expected ${path}.inclusive to be a Boolean`));

			validator.inclusive(schema['inclusive']);
		}

		return Result.Ok(validator);
	}

	#nullable: { flag: boolean };
	#schema: { flag: boolean; value: { [key: string]: Schema; } };
	#inclusive: { flag: boolean; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#schema = { flag: false, value: {} };
		this.#inclusive = { flag: false };
	}

	nullable(flag: boolean = true): this {
		this.#nullable = { flag };

		return this;
	}

	inclusive(flag: boolean = true): this {
		this.#inclusive = { flag };

		return this;
	}

	schema(value: { [key: string]: Schema }, flag: boolean = true): this {
		this.#schema = { flag, value };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (JSON.isObject(data)) {
			if (this.#schema.flag) {
				const errors: { [key: string]: ValidationError } = {};

				for (let [key, validator] of Object.entries(this.#schema.value)) {
					const result = validator.validate(data[key], `${path}.${key}`);

					if (result.isErr())
						errors[key] = result.error;
				}

				if (Object.keys(errors).length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be an Object where every Property matches the Schema Constraint`, { cause: errors }));

				// If inclusive is not set and the Object has more Properties than the Schema, return an Error
				if (!this.#inclusive.flag && Object.keys(data).length !== Object.keys(this.#schema.value).length) {
					const schemaKeys = Object.keys(this.#schema.value);
					const errors = Object.keys(data).filter(key => !schemaKeys.includes(key))
						.map(key => new ValidationError(`Expected ${path}.${key} not to exist on this Schema`));

					return Result.Err(new ValidationError(`Expected ${path} to have only the Properties defined in the Schema`, { cause: errors }));
				}
			}

			return Result.Ok(void 0);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(void 0);

		return Result.Err(new ValidationError(`Expected ${path} to be an Object${this.#nullable.flag ? '' : ' or Null'}`));
	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'object'
		};

		if (this.#nullable.flag)
			schema['nullable'] = this.#nullable.flag;

		if (this.#schema.flag)
			schema['schema'] = Object.fromEntries(Object.entries(this.#schema.value).map(([key, value]) => [key, value.toJSON()]));

		if (this.#inclusive.flag)
			schema['inclusive'] = this.#inclusive.flag;

		return schema;
	}
}

class OrValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<OrValidator, SchemaError> {
		const validator = new OrValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('oneOf' in schema) {
			if (!JSON.isArray(schema['oneOf']))
				return Result.Err(new SchemaError(`Expected ${path}.oneOf to be an Array`));

			const validatorResults: [Schema[], SchemaError[]] = schema['oneOf']
				.map(value => Schema.fromJSON(value, `${path}.oneOf`, registry))
				.reduce<[Schema[], SchemaError[]]>((acc, result) => {
					return result.match(
						value => [[...acc[0], value], acc[1]],
						error => [acc[0], [...acc[1], error]]
					);
				}, [[], []]);

			if (validatorResults[1].length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.oneOf to be an Array where every Element is a valid Schema`, { cause: validatorResults[1] }));

			validator.oneOf(validatorResults[0]);
		}

		return Result.Ok(validator);
	}

	#oneOf: { flag: boolean, value: Schema[] };

	constructor() {
		super();
		this.#oneOf = { flag: false, value: [] };
	}

	oneOf(validators: Schema[]): this {
		this.#oneOf = { flag: true, value: validators };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<void, ValidationError> {
		if (!JSON.isJSON(data))
			return Result.Err(new ValidationError(`Expected ${path} to be JSON`));

		if (this.#oneOf.flag) {
			let errors: ValidationError[] = this.#oneOf.value
				.map(validator => validator.validate(data, path))
				.reduce<ValidationError[]>((acc, value) => {
					return value.match(
						_ => acc,
						error => [...acc, error]
					);
				}, []);

			if (errors.length === this.#oneOf.value.length)
				return Result.Err(new ValidationError(`Expected ${path} to match at least one of the OneOf Validators`, { cause: errors }));

			return Result.Ok(void 0);
		}

		return Result.Ok(void 0);
	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'or'
		};

		if (this.#oneOf.flag)
			schema['oneOf'] = this.#oneOf.value.map(validator => validator.toJSON());

		return schema;
	}
}

class AndValidator extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<AndValidator, SchemaError> {
		const validator = new AndValidator();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('allOf' in schema) {
			if (!JSON.isArray(schema['allOf']))
				return Result.Err(new SchemaError(`Expected ${path}.allOf to be an Array`));

			const validatorResults: [Schema[], SchemaError[]] = [[], []];

			for (let i = 0; i < schema['allOf'].length; i++) {
				const value = schema['allOf'][i] as JSON.JSON;

				if (!JSON.isObject(value))
					validatorResults[1][i] = new SchemaError(`Expected ${path}.allOf[${i}] to be an Object`);
				else
					Schema.fromJSON(value, `${path}.allOf[${i}]`, registry).match(
						value => { validatorResults[0].push(value) },
						error => { validatorResults[1].push(error) }
					);
			}

			if (validatorResults[1].length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.allOf to be an Array where every Element is a valid Schema`, { cause: validatorResults[1] }));

			validator.allOf(Object.entries(validatorResults[0]).map(([_, value]) => value));
		}

		return Result.Ok(validator);
	}

	#allOf: { flag: boolean, value: Schema[] };

	constructor() {
		super();
		this.#allOf = { flag: false, value: [] };
	}

	allOf(validators: Schema[]): this {
		this.#allOf = { flag: true, value: validators };

		return this;
	}

	validate(data: unknown, path?: string): Result<void, ValidationError> {
		if (!JSON.isJSON(data))
			return Result.Err(new ValidationError(`Expected ${path} to be JSON`));

		if (this.#allOf.flag) {
			const errors: ValidationError[] = this.#allOf.value
				.map(validator => validator.validate(data, path))
				.reduce<ValidationError[]>((acc, value) => {
					return value.match(
						_ => acc,
						error => [...acc, error]
					);
				}, []);

			if (errors.length > 0)
				return Result.Err(new ValidationError(`Expected ${path} to match all of the AllOf Validators`, { cause: errors }));
		}

		return Result.Ok(void 0);

	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'and'
		};

		if (this.#allOf.flag)
			schema['allOf'] = this.#allOf.value.map(validator => validator.toJSON());

		return schema;
	}
}