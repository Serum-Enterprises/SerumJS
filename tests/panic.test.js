const { panic } = require('../build/panic');

describe('Testing panic.js', () => {
	let originalExit;
	let originalWrite;

	beforeEach(() => {
		// Mock process.exit and process.stderr.write
		originalExit = process.exit;
		originalWrite = process.stderr.write;

		process.exit = jest.fn();
		process.stderr.write = jest.fn();
	});

	afterEach(() => {
		// Restore original methods
		process.exit = originalExit;
		process.stderr.write = originalWrite;
	});
	test('panic(message, errorCode)', () => {
		const message = 'Error message';
		const errorCode = 42;

		panic(message, errorCode);

		expect(process.stderr.write).toHaveBeenCalledWith(message);
		expect(process.exit).toHaveBeenCalledWith(errorCode);
	});
});
