import {SchemaDomain, AssertError, NeverValidator} from '../../src';

const Schema = SchemaDomain.create();

describe('Testing Never Validator', () => {
    test('Testing assert', () => {
        const validator = Schema.Never;

        expect(() => validator.assert(undefined)).toThrow(AssertError);
        expect(() => validator.assert(null)).toThrow(AssertError);
        expect(() => validator.assert(true)).toThrow(AssertError);
        expect(() => validator.assert(1.5)).toThrow(AssertError);
        expect(() => validator.assert('Hello World')).toThrow(AssertError);
        expect(() => validator.assert([1, 2, 3])).toThrow(AssertError);
        expect(() => validator.assert({a: 1, b: 2})).toThrow(AssertError);
    });

    test('Testing toJSON', () => {
        expect(Schema.Never.toJSON()).toEqual({type: 'never'});
    });

    test('Testing fromJSON', () => {
        expect(Schema.fromJSON({type: 'never'})).toBeInstanceOf(NeverValidator);
        expect(Schema.fromJSON({type: 'never'}, 'customPath')).toBeInstanceOf(NeverValidator);
        expect(Schema.fromJSON({type: 'never'}, 'customPath')).toBeInstanceOf(NeverValidator);
    });
});
