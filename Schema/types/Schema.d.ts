import * as JSON from '@serum-enterprises/json';
import { Result } from '@serum-enterprises/result';
export declare class SchemaError extends Error {
}
export declare class ValidationError extends Error {
}
export declare abstract class Schema {
    static get Any(): AnyValidator;
    static get Boolean(): BooleanValidator;
    static get Number(): NumberValidator;
    static get String(): StringValidator;
    static get Array(): ArrayValidator;
    static get Object(): ObjectValidator;
    static get Or(): OrValidator;
    static get And(): AndValidator;
    static get defaultRegistry(): Map<string, typeof Schema>;
    static fromJSON(schema: JSON.JSON, path?: string, registry?: Map<string, typeof Schema>): Result<Schema, SchemaError>;
    abstract validate(data: unknown, path?: string): Result<JSON.JSON, ValidationError>;
    abstract toJSON(): JSON.Object;
}
declare class AnyValidator extends Schema {
    static fromJSON(schema: JSON.JSON, path?: string): Result<AnyValidator, SchemaError>;
    constructor();
    validate(data: unknown, path?: string): Result<JSON.JSON, ValidationError>;
    toJSON(): JSON.Object;
}
declare class BooleanValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string): Result<BooleanValidator, SchemaError>;
    constructor();
    nullable(flag: boolean): this;
    equals(value: boolean): this;
    validate(data: unknown, path?: string): Result<JSON.Boolean | JSON.Null, ValidationError>;
    toJSON(): JSON.Object;
}
declare class NumberValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string): Result<NumberValidator, SchemaError>;
    constructor();
    nullable(flag: boolean): this;
    equals(value: number): this;
    integer(flag?: boolean): this;
    min(value: number): this;
    max(value: number): this;
    validate(data: unknown, path?: string): Result<JSON.Number | JSON.Null, ValidationError>;
    toJSON(): JSON.Object;
}
declare class StringValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string): Result<StringValidator, SchemaError>;
    constructor();
    nullable(flag: boolean): this;
    equals(value: string): this;
    min(value: number): this;
    max(value: number): this;
    validate(data: unknown, path?: string): Result<JSON.String | JSON.Null, ValidationError>;
    toJSON(): JSON.Object;
}
declare class ArrayValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string, registry?: Map<string, typeof Schema>): Result<ArrayValidator, SchemaError>;
    constructor();
    nullable(flag?: boolean): this;
    min(value: number): this;
    max(value: number): this;
    item(validator: Schema): this;
    tuple(validators: Schema[]): this;
    validate(data: unknown, path?: string): Result<JSON.Array | JSON.Null, ValidationError>;
    toJSON(): JSON.Object;
}
declare class ObjectValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string, registry?: Map<string, typeof Schema>): Result<ObjectValidator, SchemaError>;
    constructor();
    nullable(flag?: boolean): this;
    preserve(flag?: boolean): this;
    schema(value: {
        [key: string]: Schema;
    }, flag?: boolean): this;
    validate(data: unknown, path?: string): Result<JSON.Object | JSON.Null, ValidationError>;
    toJSON(): JSON.Object;
}
declare class OrValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string, registry?: Map<string, typeof Schema>): Result<OrValidator, SchemaError>;
    constructor();
    oneOf(validators: Schema[]): this;
    validate(data: unknown, path?: string): Result<JSON.JSON, ValidationError>;
    toJSON(): JSON.Object;
}
declare class AndValidator extends Schema {
    #private;
    static fromJSON(schema: JSON.JSON, path?: string, registry?: Map<string, typeof Schema>): Result<AndValidator, SchemaError>;
    constructor();
    allOf(validators: Schema[]): this;
    validate(data: unknown, path?: string): Result<JSON.JSON, ValidationError>;
    toJSON(): JSON.Object;
}
export {};
