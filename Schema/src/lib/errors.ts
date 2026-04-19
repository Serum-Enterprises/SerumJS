export class AssertError extends Error {
	public constructor(message: string, path: string = 'data', cause: Record<string, unknown> = {}) {
		super(message, {cause: {...cause, path}});
	}
}

export class DefinitionError extends Error {
	public constructor(message: string, path: string = 'data', cause: Record<string, unknown> = {}) {
		super(message, {cause: {...cause, path}});
	}
}