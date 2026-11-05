export class AssertError extends Error {
	public constructor(
		message: string,
		public readonly path: string = "value",
		cause: Record<string, unknown> = {}
	) {
		super(message, {cause});
	}
}

export class DefinitionError extends Error {
	public constructor(
		message: string,
		public readonly path: string = "definition",
		cause: Record<string, unknown> = {}
	) {
		super(message, {cause});
	}
}

export class DomainError extends Error {}