import {SchemaDomain, AssertError, NullValidator} from '../../src';

const Schema = SchemaDomain.create();

describe('Testing Null Validator', () => {
    test('Testing assert', () => {
        const validator = Schema.Null;

        expect(() => validator.assert(undefined)).toThrow(AssertError);
        expect(() => validator.assert(null)).not.toThrow();
        expect(() => validator.assert(true)).toThrow(AssertError);
    });

    test('Testing toJSON', () => {
        expect(Schema.Null.toJSON()).toEqual({type: 'null'});
    });

    test('Testing fromJSON', () => {
        expect(NullValidator.fromJSON({type: 'null'}, undefined, Schema)).toBeInstanceOf(NullValidator);
        expect(Schema.fromJSON({type: 'null'})).toBeInstanceOf(NullValidator);
        expect(Schema.fromJSON({type: 'null'}, 'customPath')).toBeInstanceOf(NullValidator);
    });
});
