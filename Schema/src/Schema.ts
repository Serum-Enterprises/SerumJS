import * as JSON from '@serum-enterprises/json';
import { Result } from '@serum-enterprises/result';

export class SchemaError extends Error { }
export class ValidationError extends Error { }

export abstract class Schema {
	static get Any() {
		return new AnySchema();
	}

	static get Boolean() {
		return new BooleanSchema();
	}

	static get Number() {
		return new NumberSchema();
	}

	static get String() {
		return new StringSchema();
	}

	static get Array() {
		return new ArraySchema();
	}

	static get Object() {
		return new ObjectSchema();
	}

	static get Or() {
		return new OrSchema();
	}

	static get And() {
		return new AndSchema();
	}

	static get defaultRegistry(): Map<string, typeof Schema> {
		return new Map<string, typeof Schema>([
			['any', AnySchema],
			['boolean', BooleanSchema],
			['number', NumberSchema],
			['string', StringSchema],
			['array', ArraySchema],
			['object', ObjectSchema],
			['or', OrSchema],
			['and', AndSchema]
		]);
	}

	static fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<Schema, SchemaError> {
		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if (!JSON.isString(schema['type']))
			return Result.Err(new SchemaError(`Expected ${path}.type to be a String`));

		if (!registry.has(schema['type']))
			return Result.Err(new SchemaError(`Expected ${path}.type to be a registered Schema`));

		return (registry.get(schema['type']) as typeof Schema).fromJSON(schema, path, registry);
	}

	abstract validate(data: unknown, path?: string): Result<unknown, ValidationError>;

	abstract toJSON(): JSON.Object;
}

export class AnySchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<AnySchema, SchemaError> {
		const schemaInstance = new AnySchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		return Result.Ok(schemaInstance);
	}

	constructor() {
		super();
	}

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
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

export class BooleanSchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<BooleanSchema, SchemaError> {
		const schemaInstance = new BooleanSchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			schemaInstance.nullable(schema['nullable']);
		}

		if ('equals' in schema) {
			if (!JSON.isBoolean(schema['equals']))
				return Result.Err(new SchemaError(`Expected ${path}.equals to be a Boolean`));

			schemaInstance.equals(schema['equals']);
		}

		return Result.Ok(schemaInstance);
	}

	#nullable: { flag: boolean };
	#equals: { flag: boolean; value: JSON.Boolean; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#equals = { flag: false, value: false };
	}

	nullable(flag: boolean = true): this {
		this.#nullable = { flag };

		return this;
	}

	equals(value: boolean): this {
		this.#equals = { flag: true, value };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
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

export class NumberSchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<NumberSchema, SchemaError> {
		const schemaInstance = new NumberSchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			schemaInstance.nullable(schema['nullable']);
		}

		if ('equals' in schema) {
			if (!JSON.isNumber(schema['equals']))
				return Result.Err(new SchemaError(`Expected ${path}.equals to be a Number`));

			schemaInstance.equals(schema['equals']);
		}

		if ('integer' in schema) {
			if (!JSON.isBoolean(schema['integer']))
				return Result.Err(new SchemaError(`Expected ${path}.integer to be a Boolean`));

			schemaInstance.integer(schema['integer']);
		}

		if ('min' in schema) {
			if (!JSON.isNumber(schema['min']))
				return Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));

			schemaInstance.min(schema['min']);
		}

		if ('max' in schema) {
			if (!JSON.isNumber(schema['max']))
				return Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));

			schemaInstance.max(schema['max']);
		}

		return Result.Ok(schemaInstance);
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

	nullable(flag: boolean = true): this {
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

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
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

export class StringSchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema"): Result<StringSchema, SchemaError> {
		const schemaInstance = new StringSchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			schemaInstance.nullable(schema['nullable']);
		}

		if ('equals' in schema) {
			if (!JSON.isString(schema['equals']))
				return Result.Err(new SchemaError(`Expected ${path}.equals to be a String`));

			schemaInstance.equals(schema['equals']);
		}

		if ('min' in schema) {
			if (!JSON.isNumber(schema['min']))
				return Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));

			schemaInstance.min(schema['min']);
		}

		if ('max' in schema) {
			if (!JSON.isNumber(schema['max']))
				return Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));

			schemaInstance.max(schema['max']);
		}

		return Result.Ok(schemaInstance);
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

	nullable(flag: boolean = true): this {
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

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
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

export class ArraySchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<ArraySchema, SchemaError> {
		const schemaInstance = new ArraySchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			schemaInstance.nullable(schema['nullable']);
		}

		if ('min' in schema) {
			if (!JSON.isNumber(schema['min']))
				return Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));

			schemaInstance.min(schema['min']);
		}

		if ('max' in schema) {
			if (!JSON.isNumber(schema['max']))
				return Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));

			schemaInstance.max(schema['max']);
		}

		if ('every' in schema) {
			if (!JSON.isObject(schema['every']))
				return Result.Err(new SchemaError(`Expected ${path}.every to be an Object`));

			const itemSchema: Result<Schema, SchemaError> = Schema.fromJSON(schema['every'], `${path}.every`, registry);

			if (itemSchema.isOk())
				schemaInstance.every(itemSchema.value);

			if (itemSchema.isErr())
				return itemSchema;
		}

		if ('tuple' in schema) {
			if (!JSON.isArray(schema['tuple']))
				return Result.Err(new SchemaError(`Expected ${path}.tuple to be an Array`));

			const schemaResults: [{ [key: string]: Schema }, { [key: string]: SchemaError }] = [{}, {}];

			for (let i = 0; i < schema['tuple'].length; i++) {
				const value = schema['tuple'][i] as JSON.JSON;

				if (!JSON.isObject(value))
					schemaResults[1][i] = new SchemaError(`Expected ${path}.tuple[${i}] to be an Object`);

				Schema.fromJSON(value, `${path}.tuple[${i}]`, registry).match(
					value => { schemaResults[0][i] = value },
					error => { schemaResults[1][i] = error }
				);
			}

			if (Object.keys(schemaResults[1]).length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.tuple to be an Array where every Element is a valid Schema`, { cause: schemaResults[1] }));

			schemaInstance.tuple(Object.entries(schemaResults[0]).map(([_, value]) => value));
		}

		return Result.Ok(schemaInstance);
	}

	#nullable: { flag: boolean };
	#every: { flag: boolean; value: Schema; };
	#min: { flag: boolean; value: number; };
	#max: { flag: boolean; value: number; };
	#tuple: { flag: boolean; value: Schema[]; };

	constructor() {
		super();
		this.#nullable = { flag: false };
		this.#every = { flag: false, value: new AnySchema() };
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

	every(schema: Schema): this {
		this.#every = { flag: true, value: schema };

		return this;
	}

	tuple(schemas: Schema[]): this {
		this.#tuple = { flag: true, value: schemas };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
		if (JSON.isArray(data)) {
			if (this.#min.flag && this.#min.value > data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} Elements long`));

			if (this.#max.flag && this.#max.value < data.length)
				return Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} Elements long`));

			if (this.#every.flag) {
				const errors: ValidationError[] = data
					.map((value, index) => this.#every.value.validate(value, `${path}[${index}]`))
					.filter(value => value.isErr())
					.map(value => value.error);

				if (errors.length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be an Array where every Element matches the item Schema`, { cause: errors }));
			}

			if (this.#tuple.flag) {
				if (this.#tuple.value.length !== data.length)
					return Result.Err(new ValidationError(`Expected ${path} to have exactly ${this.#tuple.value.length} Elements`));

				const errors: ValidationError[] = this.#tuple.value
					.map((schema, index) => schema.validate(data[index], `${path}[${index}]`))
					.filter(value => value.isErr())
					.map(value => value.error);

				if (errors.length > 0)
					return Result.Err(new ValidationError(`Expected ${path} to be a Tuple where every Element matches its respective Schema`, { cause: errors }));
			}

			return Result.Ok(data);
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

		if (this.#every.flag)
			schema['every'] = this.#every.value.toJSON();

		if (this.#tuple.flag)
			schema['tuple'] = this.#tuple.value.map(schema => schema.toJSON());

		return schema;
	}
}

export class ObjectSchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<ObjectSchema, SchemaError> {
		const schemaInstance = new ObjectSchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('nullable' in schema) {
			if (!JSON.isBoolean(schema['nullable']))
				return Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));

			schemaInstance.nullable(schema['nullable']);
		}

		if ('schema' in schema) {
			if (!JSON.isObject(schema['schema']))
				return Result.Err(new SchemaError(`Expected ${path}.schema to be an Object`));

			const schemaResults: [{ [key: string]: Schema }, { [key: string]: SchemaError }] = [{}, {}];

			for (let [key, value] of Object.entries(schema['schema'])) {
				if (!JSON.isObject(value))
					schemaResults[1][key] = new SchemaError(`Expected ${path}.schema.${key} to be an Object`);

				Schema.fromJSON(value, path, registry).match(
					value => { schemaResults[0][key] = value },
					error => { schemaResults[1][key] = error }
				);
			}

			if (Object.keys(schemaResults[1]).length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.schema to be an Object where every Property is a valid Schema`, { cause: schemaResults[1] }));

			schemaInstance.schema(schemaResults[0]);
		}

		if ('inclusive' in schema) {
			if (!JSON.isBoolean(schema['inclusive']))
				return Result.Err(new SchemaError(`Expected ${path}.inclusive to be a Boolean`));

			schemaInstance.inclusive(schema['inclusive']);
		}

		return Result.Ok(schemaInstance);
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

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
		if (JSON.isObject(data)) {
			if (this.#schema.flag) {
				const errors: { [key: string]: ValidationError } = {};

				for (let [key, schema] of Object.entries(this.#schema.value)) {
					const result = schema.validate(data[key], `${path}.${key}`);

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

			return Result.Ok(data);
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

		if (this.#inclusive.flag)
			schema['inclusive'] = this.#inclusive.flag;

		return schema;
	}
}

export class OrSchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<OrSchema, SchemaError> {
		const schemaInstance = new OrSchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('oneOf' in schema) {
			if (!JSON.isArray(schema['oneOf']))
				return Result.Err(new SchemaError(`Expected ${path}.oneOf to be an Array`));

			const schemaResults: [Schema[], SchemaError[]] = schema['oneOf']
				.map(value => Schema.fromJSON(value, `${path}.oneOf`, registry))
				.reduce<[Schema[], SchemaError[]]>((acc, result) => {
					return result.match(
						value => [[...acc[0], value], acc[1]],
						error => [acc[0], [...acc[1], error]]
					);
				}, [[], []]);

			if (schemaResults[1].length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.oneOf to be an Array where every Element is a valid Schema`, { cause: schemaResults[1] }));

			schemaInstance.oneOf(schemaResults[0]);
		}

		return Result.Ok(schemaInstance);
	}

	#oneOf: { flag: boolean, value: Schema[] };

	constructor() {
		super();
		this.#oneOf = { flag: false, value: [] };
	}

	oneOf(schemas: Schema[]): this {
		this.#oneOf = { flag: true, value: schemas };

		return this;
	}

	validate(data: unknown, path: string = 'data'): Result<unknown, ValidationError> {
		if (!JSON.isJSON(data))
			return Result.Err(new ValidationError(`Expected ${path} to be JSON`));

		if (this.#oneOf.flag) {
			let errors: ValidationError[] = this.#oneOf.value
				.map(schema => schema.validate(data, path))
				.reduce<ValidationError[]>((acc, value) => {
					return value.match(
						_ => acc,
						error => [...acc, error]
					);
				}, []);

			if (errors.length === this.#oneOf.value.length)
				return Result.Err(new ValidationError(`Expected ${path} to match at least one of the OneOf Schemas`, { cause: errors }));

			return Result.Ok(data);
		}

		return Result.Ok(data);
	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'or'
		};

		if (this.#oneOf.flag)
			schema['oneOf'] = this.#oneOf.value.map(schema => schema.toJSON());

		return schema;
	}
}

export class AndSchema extends Schema {
	static override fromJSON(schema: JSON.JSON, path: string = "schema", registry: Map<string, typeof Schema> = Schema.defaultRegistry): Result<AndSchema, SchemaError> {
		const schemaInstance = new AndSchema();

		if (!JSON.isObject(schema))
			return Result.Err(new SchemaError(`Expected ${path} to be an Object`));

		if ('allOf' in schema) {
			if (!JSON.isArray(schema['allOf']))
				return Result.Err(new SchemaError(`Expected ${path}.allOf to be an Array`));

			const schemaResults: [Schema[], SchemaError[]] = [[], []];

			for (let i = 0; i < schema['allOf'].length; i++) {
				const value = schema['allOf'][i] as JSON.JSON;

				if (!JSON.isObject(value))
					schemaResults[1][i] = new SchemaError(`Expected ${path}.allOf[${i}] to be an Object`);
				else
					Schema.fromJSON(value, `${path}.allOf[${i}]`, registry).match(
						value => { schemaResults[0].push(value) },
						error => { schemaResults[1].push(error) }
					);
			}

			if (schemaResults[1].length > 0)
				return Result.Err(new SchemaError(`Expected ${path}.allOf to be an Array where every Element is a valid Schema`, { cause: schemaResults[1] }));

			schemaInstance.allOf(Object.entries(schemaResults[0]).map(([_, value]) => value));
		}

		return Result.Ok(schemaInstance);
	}

	#allOf: { flag: boolean, value: Schema[] };

	constructor() {
		super();
		this.#allOf = { flag: false, value: [] };
	}

	allOf(schemas: Schema[]): this {
		this.#allOf = { flag: true, value: schemas };

		return this;
	}

	validate(data: unknown, path?: string): Result<unknown, ValidationError> {
		if (!JSON.isJSON(data))
			return Result.Err(new ValidationError(`Expected ${path} to be JSON`));

		if (this.#allOf.flag) {
			const errors: ValidationError[] = this.#allOf.value
				.map(schema => schema.validate(data, path))
				.reduce<ValidationError[]>((acc, value) => {
					return value.match(
						_ => acc,
						error => [...acc, error]
					);
				}, []);

			if (errors.length > 0)
				return Result.Err(new ValidationError(`Expected ${path} to match all of the AllOf Schemas`, { cause: errors }));
		}

		return Result.Ok(data);

	}

	toJSON(): JSON.Object {
		const schema: JSON.Object = {
			type: 'and'
		};

		if (this.#allOf.flag)
			schema['allOf'] = this.#allOf.value.map(schema => schema.toJSON());

		return schema;
	}
}