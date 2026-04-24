export class AssertError extends Error {
	public constructor(message: string, path: string = 'data', cause: ErrorOptions = {}) {
		super(message, {cause: {...cause, path}});
	}
}

export class DefinitionError extends Error {
	public constructor(message: string, path: string = 'definition', cause: ErrorOptions = {}) {
		super(message, {cause: {...cause, path}});
	}
}

export class DomainError extends Error {}