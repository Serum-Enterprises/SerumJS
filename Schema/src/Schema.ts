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

	abstract validate(data: unknown, path?: string): Result<JSON.JSON, ValidationError>;

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

	validate(data: unknown, path: string = 'data'): Result<JSON.JSON, ValidationError> {
		if (!JSON.isJSON(data))
			return Result.Err(new ValidationError(`Expected ${path} to be JSON`));

		return Result.Ok(data);
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

	validate(data: unknown, path: string = 'data'): Result<JSON.Boolean | JSON.Null, ValidationError> {
		if (JSON.isBoolean(data)) {
			if (this.#equals.flag && this.#equals.value !== data)
				return Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}${this.#nullable.flag ? '' : ' or Null'}`));

			return Result.Ok(data);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(data);

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

	validate(data: unknown, path: string = 'data'): Result<JSON.Number | JSON.Null, ValidationError> {
		if (JSON.isNumber(data)) {
			if (this.#equals.flag && this.#equals.value !== data)
				return Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}`));

			if (this.#integer.flag && !Number.isInteger(data))
				return Result.Err(new ValidationError(`Expected ${path} to be an Integer`));

			if (this.#min.flag && this.#min.value > data)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value}`));

			if (this.#max.flag && this.#max.value < data)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value}`));

			return Result.Ok(data);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(data);

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

	validate(data: unknown, path: string = 'data'): Result<JSON.String | JSON.Null, ValidationError> {
		if (JSON.isString(data)) {
			if (this.#equals.flag && this.#equals.value !== data)
				return Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}`));

			if (this.#min.flag && this.#min.value > data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} characters long`));

			if (this.#max.flag && this.#max.value < data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} characters long`));

			return Result.Ok(data);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(data);

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

		if ('item' in schema) {
			if (!JSON.isObject(schema['item']))
				return Result.Err(new SchemaError(`Expected ${path}.item to be an Object`));

			const itemValidator: Result<Schema, SchemaError> = Schema.fromJSON(schema['item'], `${path}.item`, registry);

			if (itemValidator.isOk())
				validator.item(itemValidator.value);

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
	#item: { flag: boolean; validator: Schema; };
	#min: { flag: boolean; value: number; };
	#max: { flag: boolean; value: number; };
	#tuple: { flag: boolean; value: Schema[]; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#item = { flag: false, validator: new AnyValidator() };
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

	item(validator: Schema): this {
		this.#item = { flag: true, validator };

		return this;
	}

	tuple(validators: Schema[]): this {
		this.#tuple = { flag: true, value: validators };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<JSON.Array | JSON.Null, ValidationError> {
		if (JSON.isArray(data)) {
			let result: JSON.Array = data;

			if (this.#min.flag && this.#min.value > data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} Elements long`));

			if (this.#max.flag && this.#max.value < data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} Elements long`));

			if (this.#item.flag) {
				let validatorResults: [JSON.JSON[], ValidationError[]] = [[], []];

				validatorResults = data
					.map((value, index) => this.#item.validator.validate(value, `${path}[${index}]`))
					.reduce<[JSON.JSON[], ValidationError[]]>((acc, value) => {
						return value.match(
							value => [[...acc[0], value], acc[1]],
							error => [acc[0], [...acc[1], error]]
						);
					}, [[], []]);

				if (validatorResults[1].length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be an Array where every Element matches the item Validator`, { cause: result[1] }));
				else
					result = validatorResults[0];
			}

			if (this.#tuple.flag) {
				if (this.#tuple.value.length !== data.length)
					return Result.Err(new ValidationError(`Expected ${path} to have exactly ${this.#tuple.value.length} Elements`));

				let validatorResults: [JSON.JSON[], ValidationError[]] = [[], []];

				validatorResults = this.#tuple.value
					.map((validator, index) => validator.validate(data[index], `${path}[${index}]`))
					.reduce<[JSON.JSON[], ValidationError[]]>((acc, value) => {
						return value.match(
							value => [[...acc[0], value], acc[1]],
							error => [acc[0], [...acc[1], error]]
						);
					}, [[], []]);

				if (validatorResults[1].length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be a Tuple where every Element matches its respective Validator`, { cause: result[1] }));
				else
					result = validatorResults[0];
			}

			return Result.Ok(result);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(data);

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

		if (this.#item.flag)
			schema['item'] = this.#item.validator.toJSON();

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

		if ('preserve' in schema) {
			if (!JSON.isBoolean(schema['preserve']))
				return Result.Err(new SchemaError(`Expected ${path}.preserve to be a Boolean`));

			validator.preserve(schema['preserve']);
		}

		return Result.Ok(validator);
	}

	#nullable: { flag: boolean };
	#schema: { flag: boolean; value: { [key: string]: Schema; } };
	#preserve: { flag: boolean; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#schema = { flag: false, value: {} };
		this.#preserve = { flag: false };
	}

	nullable(flag: boolean = true): this {
		this.#nullable = { flag };

		return this;
	}

	preserve(flag: boolean = true): this {
		this.#preserve = { flag };

		return this;
	}

	schema(value: { [key: string]: Schema }, flag: boolean = true): this {
		this.#schema = { flag, value };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<JSON.Object | JSON.Null, ValidationError> {
		if (JSON.isObject(data)) {
			let result: [{ [key: string]: JSON.JSON }, { [key: string]: ValidationError }] = [{}, {}];

			if (this.#schema.flag) {
				// Run all Validators in the Schema (i.e. map this.#schema.value into [key, Result<JSON.JSON, ValidationError>])
				// Then reduce the Result<JSON.JSON, ValidationError> into a Tuple of Pair Arrays (i.e. [[string, JSON.JSON][], [string, ValidationError][]])
				// If the second Array is empty, return the first Array as an Object, otherwise return the second Array as an Error
				for (let [key, validator] of Object.entries(this.#schema.value)) {
					const value = validator.validate(data[key], `${path}.${key}`);

					value.match(
						value => { result[0][key] = value },
						error => { result[1][key] = error }
					);
				}

				if (Object.keys(result[1]).length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be an Object where every Property matches the Schema Constraint`, { cause: result[1] }));

				if (this.#preserve.flag) {
					for (let [key, value] of Object.entries(data)) {
						if (!(key in this.#schema.value))
							result[0][key] = value;
					}
				}
			}

			return Result.Ok(result[0]);
		}

		if (this.#nullable.flag && JSON.isNull(data))
			return Result.Ok(data);

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

		if (this.#preserve.flag)
			schema['preserve'] = this.#preserve.flag;

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

	validate(data: unknown, path: string = 'data'): Result<JSON.JSON, ValidationError> {
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

			return Result.Ok(data);
		}

		return Result.Ok(data);
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

	validate(data: unknown, path?: string): Result<JSON.JSON, ValidationError> {
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

		return Result.Ok(data);

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