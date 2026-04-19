import {AssertError, DefinitionError} from "../../src";

describe('Testing Errors', () => {
	test('Testing AssertError', () => {
		expect(new AssertError('Message').cause).toEqual({path: 'data'});
	});

	test('Testing DefinitionError', () => {
		expect(new DefinitionError('Message').cause).toEqual({path: 'data'});
	});
});