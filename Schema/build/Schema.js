"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schema = exports.ValidationError = exports.SchemaError = void 0;
const JSON = __importStar(require("@serum-enterprises/json"));
const result_1 = require("@serum-enterprises/result");
class SchemaError extends Error {
}
exports.SchemaError = SchemaError;
class ValidationError extends Error {
}
exports.ValidationError = ValidationError;
class Schema {
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
    static get defaultRegistry() {
        return new Map([
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
    static fromJSON(schema, path = "schema", registry = Schema.defaultRegistry) {
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if (!JSON.isString(schema['type']))
            return result_1.Result.Err(new SchemaError(`Expected ${path}.type to be a String`));
        if (!registry.has(schema['type']))
            return result_1.Result.Err(new SchemaError(`Expected ${path}.type to be a registered Validator`));
        return registry.get(schema['type']).fromJSON(schema, path, registry);
    }
}
exports.Schema = Schema;
class AnyValidator extends Schema {
    static fromJSON(schema, path = "schema") {
        const validator = new AnyValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        return result_1.Result.Ok(validator);
    }
    constructor() {
        super();
    }
    validate(data, path = 'data') {
        if (!JSON.isJSON(data))
            return result_1.Result.Err(new ValidationError(`Expected ${path} to be JSON`));
        return result_1.Result.Ok(data);
    }
    toJSON() {
        return {
            type: 'any'
        };
    }
}
class BooleanValidator extends Schema {
    static fromJSON(schema, path = "schema") {
        const validator = new BooleanValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('nullable' in schema) {
            if (!JSON.isBoolean(schema['nullable']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));
            validator.nullable(schema['nullable']);
        }
        if ('equals' in schema) {
            if (!JSON.isBoolean(schema['equals']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.equals to be a Boolean`));
            validator.equals(schema['equals']);
        }
        return result_1.Result.Ok(validator);
    }
    #nullable;
    #equals;
    constructor() {
        super();
        this.#nullable = { flag: false };
        this.#equals = { flag: false, value: false };
    }
    nullable(flag) {
        this.#nullable = { flag };
        return this;
    }
    equals(value) {
        this.#equals = { flag: true, value };
        return this;
    }
    validate(data, path = 'data') {
        if (JSON.isBoolean(data)) {
            if (this.#equals.flag && this.#equals.value !== data)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}${this.#nullable.flag ? '' : ' or Null'}`));
            return result_1.Result.Ok(data);
        }
        if (this.#nullable.flag && JSON.isNull(data))
            return result_1.Result.Ok(data);
        return result_1.Result.Err(new ValidationError(`Expected ${path} to be a Boolean${this.#nullable.flag ? '' : ' or Null'}`));
    }
    toJSON() {
        const schema = {
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
    static fromJSON(schema, path = "schema") {
        const validator = new NumberValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('nullable' in schema) {
            if (!JSON.isBoolean(schema['nullable']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));
            validator.nullable(schema['nullable']);
        }
        if ('equals' in schema) {
            if (!JSON.isNumber(schema['equals']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.equals to be a Number`));
            validator.equals(schema['equals']);
        }
        if ('integer' in schema) {
            if (!JSON.isBoolean(schema['integer']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.integer to be a Boolean`));
            validator.integer(schema['integer']);
        }
        if ('min' in schema) {
            if (!JSON.isNumber(schema['min']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));
            validator.min(schema['min']);
        }
        if ('max' in schema) {
            if (!JSON.isNumber(schema['max']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));
            validator.max(schema['max']);
        }
        return result_1.Result.Ok(validator);
    }
    #nullable;
    #equals;
    #integer;
    #min;
    #max;
    constructor() {
        super();
        this.#nullable = { flag: false };
        this.#equals = { flag: false, value: 0 };
        this.#integer = { flag: false };
        this.#min = { flag: false, value: 0 };
        this.#max = { flag: false, value: 0 };
    }
    nullable(flag) {
        this.#nullable = { flag };
        return this;
    }
    equals(value) {
        this.#equals = { flag: true, value };
        return this;
    }
    integer(flag = true) {
        this.#integer = { flag };
        return this;
    }
    min(value) {
        this.#min = { flag: true, value };
        return this;
    }
    max(value) {
        this.#max = { flag: true, value };
        return this;
    }
    validate(data, path = 'data') {
        if (JSON.isNumber(data)) {
            if (this.#equals.flag && this.#equals.value !== data)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}`));
            if (this.#integer.flag && !Number.isInteger(data))
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be an Integer`));
            if (this.#min.flag && this.#min.value > data)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value}`));
            if (this.#max.flag && this.#max.value < data)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value}`));
            return result_1.Result.Ok(data);
        }
        if (this.#nullable.flag && JSON.isNull(data))
            return result_1.Result.Ok(data);
        return result_1.Result.Err(new ValidationError(`Expected ${path} to be a Number${this.#nullable.flag ? '' : ' or Null'}`));
    }
    toJSON() {
        const schema = {
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
    static fromJSON(schema, path = "schema") {
        const validator = new StringValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('nullable' in schema) {
            if (!JSON.isBoolean(schema['nullable']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));
            validator.nullable(schema['nullable']);
        }
        if ('equals' in schema) {
            if (!JSON.isString(schema['equals']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.equals to be a String`));
            validator.equals(schema['equals']);
        }
        if ('min' in schema) {
            if (!JSON.isNumber(schema['min']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));
            validator.min(schema['min']);
        }
        if ('max' in schema) {
            if (!JSON.isNumber(schema['max']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));
            validator.max(schema['max']);
        }
        return result_1.Result.Ok(validator);
    }
    #nullable;
    #equals;
    #min;
    #max;
    constructor() {
        super();
        this.#nullable = { flag: false };
        this.#equals = { flag: false, value: "" };
        this.#min = { flag: false, value: 0 };
        this.#max = { flag: false, value: 0 };
    }
    nullable(flag) {
        this.#nullable = { flag };
        return this;
    }
    equals(value) {
        this.#equals = { flag: true, value };
        return this;
    }
    min(value) {
        this.#min = { flag: true, value };
        return this;
    }
    max(value) {
        this.#max = { flag: true, value };
        return this;
    }
    validate(data, path = 'data') {
        if (JSON.isString(data)) {
            if (this.#equals.flag && this.#equals.value !== data)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be ${this.#equals.value}`));
            if (this.#min.flag && this.#min.value > data.length)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} characters long`));
            if (this.#max.flag && this.#max.value < data.length)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} characters long`));
            return result_1.Result.Ok(data);
        }
        if (this.#nullable.flag && JSON.isNull(data))
            return result_1.Result.Ok(data);
        return result_1.Result.Err(new ValidationError(`Expected ${path} to be a String${this.#nullable.flag ? '' : ' or Null'}`));
    }
    toJSON() {
        const schema = {
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
    static fromJSON(schema, path = "schema", registry = Schema.defaultRegistry) {
        const validator = new ArrayValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('nullable' in schema) {
            if (!JSON.isBoolean(schema['nullable']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));
            validator.nullable(schema['nullable']);
        }
        if ('min' in schema) {
            if (!JSON.isNumber(schema['min']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.min to be a Number`));
            validator.min(schema['min']);
        }
        if ('max' in schema) {
            if (!JSON.isNumber(schema['max']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.max to be a Number`));
            validator.max(schema['max']);
        }
        if ('every' in schema) {
            if (!JSON.isObject(schema['every']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.every to be an Object`));
            const itemValidator = Schema.fromJSON(schema['every'], `${path}.every`, registry);
            if (itemValidator.isOk())
                validator.every(itemValidator.value);
            if (itemValidator.isErr())
                return itemValidator;
        }
        if ('tuple' in schema) {
            if (!JSON.isArray(schema['tuple']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.tuple to be an Array`));
            const validatorResults = [{}, {}];
            for (let i = 0; i < schema['tuple'].length; i++) {
                const value = schema['tuple'][i];
                if (!JSON.isObject(value))
                    validatorResults[1][i] = new SchemaError(`Expected ${path}.tuple[${i}] to be an Object`);
                Schema.fromJSON(value, `${path}.tuple[${i}]`, registry).match(value => { validatorResults[0][i] = value; }, error => { validatorResults[1][i] = error; });
            }
            if (Object.keys(validatorResults[1]).length > 0)
                return result_1.Result.Err(new SchemaError(`Expected ${path}.tuple to be an Array where every Element is a valid Schema`, { cause: validatorResults[1] }));
            validator.tuple(Object.entries(validatorResults[0]).map(([_, value]) => value));
        }
        return result_1.Result.Ok(validator);
    }
    #nullable;
    #every;
    #min;
    #max;
    #tuple;
    constructor() {
        super();
        this.#nullable = { flag: false };
        this.#every = { flag: false, value: new AnyValidator() };
        this.#min = { flag: false, value: 0 };
        this.#max = { flag: false, value: 0 };
        this.#tuple = { flag: false, value: [] };
    }
    nullable(flag = true) {
        this.#nullable = { flag };
        return this;
    }
    min(value) {
        this.#min = { flag: true, value };
        return this;
    }
    max(value) {
        this.#max = { flag: true, value };
        return this;
    }
    every(validator) {
        this.#every = { flag: true, value: validator };
        return this;
    }
    tuple(validators) {
        this.#tuple = { flag: true, value: validators };
        return this;
    }
    validate(data, path = 'data') {
        if (JSON.isArray(data)) {
            if (this.#min.flag && this.#min.value > data.length)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be at least ${this.#min.value} Elements long`));
            if (this.#max.flag && this.#max.value < data.length)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to be at most ${this.#max.value} Elements long`));
            if (this.#every.flag) {
                const errors = data
                    .map((value, index) => this.#every.value.validate(value, `${path}[${index}]`))
                    .filter(value => value.isErr())
                    .map(value => value.error);
                if (errors.length > 0)
                    return result_1.Result.Err(new ValidationError(`Expected ${path} to be an Array where every Element matches the item Validator`, { cause: errors }));
            }
            if (this.#tuple.flag) {
                if (this.#tuple.value.length !== data.length)
                    return result_1.Result.Err(new ValidationError(`Expected ${path} to have exactly ${this.#tuple.value.length} Elements`));
                const errors = this.#tuple.value
                    .map((validator, index) => validator.validate(data[index], `${path}[${index}]`))
                    .filter(value => value.isErr())
                    .map(value => value.error);
                if (errors.length > 0)
                    return result_1.Result.Err(new ValidationError(`Expected ${path} to be a Tuple where every Element matches its respective Validator`, { cause: errors }));
            }
            return result_1.Result.Ok(data);
        }
        if (this.#nullable.flag && JSON.isNull(data))
            return result_1.Result.Ok(data);
        return result_1.Result.Err(new ValidationError(`Expected ${path} to be an Array${this.#nullable.flag ? '' : ' or Null'}`));
    }
    toJSON() {
        const schema = {
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
            schema['tuple'] = this.#tuple.value.map(validator => validator.toJSON());
        return schema;
    }
}
class ObjectValidator extends Schema {
    static fromJSON(schema, path = "schema", registry = Schema.defaultRegistry) {
        const validator = new ObjectValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('nullable' in schema) {
            if (!JSON.isBoolean(schema['nullable']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.nullable to be a Boolean`));
            validator.nullable(schema['nullable']);
        }
        if ('schema' in schema) {
            if (!JSON.isObject(schema['schema']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.schema to be an Object`));
            const validatorResults = [{}, {}];
            for (let [key, value] of Object.entries(schema['schema'])) {
                if (!JSON.isObject(value))
                    validatorResults[1][key] = new SchemaError(`Expected ${path}.schema.${key} to be an Object`);
                Schema.fromJSON(value, path, registry).match(value => { validatorResults[0][key] = value; }, error => { validatorResults[1][key] = error; });
            }
            if (Object.keys(validatorResults[1]).length > 0)
                return result_1.Result.Err(new SchemaError(`Expected ${path}.schema to be an Object where every Property is a valid Schema`, { cause: validatorResults[1] }));
            validator.schema(validatorResults[0]);
        }
        if ('inclusive' in schema) {
            if (!JSON.isBoolean(schema['inclusive']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.inclusive to be a Boolean`));
            validator.inclusive(schema['inclusive']);
        }
        return result_1.Result.Ok(validator);
    }
    #nullable;
    #schema;
    #inclusive;
    constructor() {
        super();
        this.#nullable = { flag: false };
        this.#schema = { flag: false, value: {} };
        this.#inclusive = { flag: false };
    }
    nullable(flag = true) {
        this.#nullable = { flag };
        return this;
    }
    inclusive(flag = true) {
        this.#inclusive = { flag };
        return this;
    }
    schema(value, flag = true) {
        this.#schema = { flag, value };
        return this;
    }
    validate(data, path = 'data') {
        if (JSON.isObject(data)) {
            if (this.#schema.flag) {
                const errors = {};
                for (let [key, validator] of Object.entries(this.#schema.value)) {
                    const result = validator.validate(data[key], `${path}.${key}`);
                    if (result.isErr())
                        errors[key] = result.error;
                }
                if (Object.keys(errors).length > 0)
                    return result_1.Result.Err(new ValidationError(`Expected ${path} to be an Object where every Property matches the Schema Constraint`, { cause: errors }));
                // If inclusive is not set and the Object has more Properties than the Schema, return an Error
                if (!this.#inclusive.flag && Object.keys(data).length !== Object.keys(this.#schema.value).length) {
                    const schemaKeys = Object.keys(this.#schema.value);
                    const errors = Object.keys(data).filter(key => !schemaKeys.includes(key))
                        .map(key => new ValidationError(`Expected ${path}.${key} not to exist on this Schema`));
                    return result_1.Result.Err(new ValidationError(`Expected ${path} to have only the Properties defined in the Schema`, { cause: errors }));
                }
            }
            return result_1.Result.Ok(data);
        }
        if (this.#nullable.flag && JSON.isNull(data))
            return result_1.Result.Ok(data);
        return result_1.Result.Err(new ValidationError(`Expected ${path} to be an Object${this.#nullable.flag ? '' : ' or Null'}`));
    }
    toJSON() {
        const schema = {
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
    static fromJSON(schema, path = "schema", registry = Schema.defaultRegistry) {
        const validator = new OrValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('oneOf' in schema) {
            if (!JSON.isArray(schema['oneOf']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.oneOf to be an Array`));
            const validatorResults = schema['oneOf']
                .map(value => Schema.fromJSON(value, `${path}.oneOf`, registry))
                .reduce((acc, result) => {
                return result.match(value => [[...acc[0], value], acc[1]], error => [acc[0], [...acc[1], error]]);
            }, [[], []]);
            if (validatorResults[1].length > 0)
                return result_1.Result.Err(new SchemaError(`Expected ${path}.oneOf to be an Array where every Element is a valid Schema`, { cause: validatorResults[1] }));
            validator.oneOf(validatorResults[0]);
        }
        return result_1.Result.Ok(validator);
    }
    #oneOf;
    constructor() {
        super();
        this.#oneOf = { flag: false, value: [] };
    }
    oneOf(validators) {
        this.#oneOf = { flag: true, value: validators };
        return this;
    }
    validate(data, path = 'data') {
        if (!JSON.isJSON(data))
            return result_1.Result.Err(new ValidationError(`Expected ${path} to be JSON`));
        if (this.#oneOf.flag) {
            let errors = this.#oneOf.value
                .map(validator => validator.validate(data, path))
                .reduce((acc, value) => {
                return value.match(_ => acc, error => [...acc, error]);
            }, []);
            if (errors.length === this.#oneOf.value.length)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to match at least one of the OneOf Validators`, { cause: errors }));
            return result_1.Result.Ok(data);
        }
        return result_1.Result.Ok(data);
    }
    toJSON() {
        const schema = {
            type: 'or'
        };
        if (this.#oneOf.flag)
            schema['oneOf'] = this.#oneOf.value.map(validator => validator.toJSON());
        return schema;
    }
}
class AndValidator extends Schema {
    static fromJSON(schema, path = "schema", registry = Schema.defaultRegistry) {
        const validator = new AndValidator();
        if (!JSON.isObject(schema))
            return result_1.Result.Err(new SchemaError(`Expected ${path} to be an Object`));
        if ('allOf' in schema) {
            if (!JSON.isArray(schema['allOf']))
                return result_1.Result.Err(new SchemaError(`Expected ${path}.allOf to be an Array`));
            const validatorResults = [[], []];
            for (let i = 0; i < schema['allOf'].length; i++) {
                const value = schema['allOf'][i];
                if (!JSON.isObject(value))
                    validatorResults[1][i] = new SchemaError(`Expected ${path}.allOf[${i}] to be an Object`);
                else
                    Schema.fromJSON(value, `${path}.allOf[${i}]`, registry).match(value => { validatorResults[0].push(value); }, error => { validatorResults[1].push(error); });
            }
            if (validatorResults[1].length > 0)
                return result_1.Result.Err(new SchemaError(`Expected ${path}.allOf to be an Array where every Element is a valid Schema`, { cause: validatorResults[1] }));
            validator.allOf(Object.entries(validatorResults[0]).map(([_, value]) => value));
        }
        return result_1.Result.Ok(validator);
    }
    #allOf;
    constructor() {
        super();
        this.#allOf = { flag: false, value: [] };
    }
    allOf(validators) {
        this.#allOf = { flag: true, value: validators };
        return this;
    }
    validate(data, path) {
        if (!JSON.isJSON(data))
            return result_1.Result.Err(new ValidationError(`Expected ${path} to be JSON`));
        if (this.#allOf.flag) {
            const errors = this.#allOf.value
                .map(validator => validator.validate(data, path))
                .reduce((acc, value) => {
                return value.match(_ => acc, error => [...acc, error]);
            }, []);
            if (errors.length > 0)
                return result_1.Result.Err(new ValidationError(`Expected ${path} to match all of the AllOf Validators`, { cause: errors }));
        }
        return result_1.Result.Ok(data);
    }
    toJSON() {
        const schema = {
            type: 'and'
        };
        if (this.#allOf.flag)
            schema['allOf'] = this.#allOf.value.map(validator => validator.toJSON());
        return schema;
    }
}
