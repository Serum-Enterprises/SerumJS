export function panic(message: string, errorCode: number = 1): never {
	const stack = new Error().stack?.split('\n').slice(2).join('\n');

	process.stderr.write(message);

	if (stack) {
		process.stderr.write(stack);
	}

	process.exit(errorCode);
}