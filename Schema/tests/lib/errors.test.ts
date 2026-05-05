import {AssertError, DefinitionError, MergeError, DomainError} from "../../src/lib/errors";

describe('Testing Errors', () => {
	test('Testing AssertError', () => {
		const error = new AssertError('Message', 'custom.path', {foo: 'bar'});
		expect(error.message).toBe('Message');
		expect(error.cause).toEqual({path: 'custom.path', foo: 'bar'});

		const defaultError = new AssertError('Default');
		expect(defaultError.cause).toEqual({path: 'data'});
	});

	test('Testing DefinitionError', () => {
		const error = new DefinitionError('Message', 'custom.path', {foo: 'bar'});
		expect(error.message).toBe('Message');
		expect(error.cause).toEqual({path: 'custom.path', foo: 'bar'});

		const defaultError = new DefinitionError('Default');
		expect(defaultError.cause).toEqual({path: 'definition'});
	});

	test('Testing MergeError', () => {
		const error = new MergeError('Message', 'custom.path', {foo: 'bar'});
		expect(error.message).toBe('Message');
		expect(error.cause).toEqual({path: 'custom.path', foo: 'bar'});

		const defaultError = new MergeError('Default');
		expect(defaultError.cause).toEqual({path: 'validator'});
	});

	test('Testing DomainError', () => {
		const error = new DomainError('Domain Message');
		expect(error.message).toBe('Domain Message');
		expect(error).toBeInstanceOf(Error);
	});
});