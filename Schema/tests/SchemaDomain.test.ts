import {SchemaDomain, DefinitionError, DomainError, BooleanValidator} from '../src';

describe('Testing SchemaDomain', () => {
	test('Testing static create', () => {
		expect(SchemaDomain.create()).toBeDefined();
		expect(SchemaDomain.create({
			bool: BooleanValidator
		})).toBeDefined();
		expect(() => SchemaDomain.create({
			bool: BooleanValidator,
			Bool: BooleanValidator
		})).toThrow(DomainError);
	});

	test('Testing fromJSON', () => {
		const Schema = SchemaDomain.create();

		expect(() => Schema.fromJSON('invalid')).toThrow(DefinitionError);
		expect(() => Schema.fromJSON({type: 'invalid'})).toThrow(DefinitionError);
		expect(() => Schema.fromJSON({})).toThrow(DefinitionError);
		expect(Schema.fromJSON({type: 'boolean'})).toBeInstanceOf(BooleanValidator);
	});
});
