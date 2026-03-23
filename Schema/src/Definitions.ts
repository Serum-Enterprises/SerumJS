export interface Definition {
	type: string;
}

export interface JSONValidatorDefinition extends Definition {
	type: 'json';
}

export interface BooleanValidatorDefinition extends Definition {
	type: 'boolean';
	nullable?: boolean;
	equals?: boolean;
}

export interface NumberValidatorDefinition extends Definition {
	type: 'number';
	nullable?: boolean;
	equals?: number;
	integer?: boolean;
	min?: number;
	max?: number;
}

export interface StringValidatorDefinition extends Definition {
	type: 'string';
	nullable?: boolean;
	equals?: string;
	min?: number;
	max?: number;
}

export interface ArrayValidatorDefinition<
	// Every Type Definition
	E extends Definition = Definition,
	// Tuple Type Definition
	T extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'array';
	nullable?: boolean;
	min?: number;
	max?: number;
	every?: E;
	tuple?: T;
}

export interface ObjectValidatorDefinition<
	// Every Type Definition
	E extends Definition = Definition,
	// Shape Type Definition
	S extends { [key: string]: Definition } = { [key: string]: Definition }
> extends Definition {
	type: 'object';
	nullable?: boolean;
	exact?: boolean;
	min?: number;
	max?: number;
	every?: E;
	shape?: S;
}
