import {JSON} from '@serum-enterprises/json';
import {Validator, ValidatorClass} from './Validator';
import {DefinitionError, DomainError} from './lib/errors';
import * as Validators from './validators';

export const DefaultSchemaDomain = {
	Never: Validators.NeverValidator,
	Null: Validators.NullValidator,
	JSON: Validators.JSONValidator,
	Boolean: Validators.BooleanValidator,
	Number: Validators.NumberValidator,
	String: Validators.StringValidator,
	Array: Validators.ArrayValidator,
	Object: Validators.ObjectValidator
} as const;

type DynamicSchemaDomain<T extends Record<string, ValidatorClass>> = SchemaDomain & {
	readonly [K in keyof T]: InstanceType<T[K]>;
};

export class SchemaDomain {
	public static create<T extends Record<string, ValidatorClass<any>> = typeof DefaultSchemaDomain>(
		entries?: T
	): DynamicSchemaDomain<T> {
		const domainEntries = entries ? entries : DefaultSchemaDomain;
		const domain: DynamicSchemaDomain<T> = new SchemaDomain(domainEntries) as DynamicSchemaDomain<T>;

		for (const [key, validator] of Object.entries(domainEntries) as [keyof T, T[keyof T]][]) {
			Object.defineProperty(domain, key, {
				get() {
					return new validator();
				},
				enumerable: true,
				configurable: true
			});
		}

		return domain;
	}

	private readonly _normalizedEntries: ReadonlyMap<string, ValidatorClass>;

	private constructor(
		public readonly entries: Readonly<Record<string, ValidatorClass>>
	) {
		this._normalizedEntries = Object.entries(entries).reduce((result, [key, value]) => {
			if(result.has(key.toLowerCase()))
				throw new DomainError(`Duplicate normalized key found`, {cause: [key.toLowerCase()]});

			return result.set(key.toLowerCase(), value);
		}, new Map())
	}

	public fromJSON(data: unknown, path: string = 'data'): Validator {
		if (!JSON.isShallowObject(data))
			throw new DefinitionError(`Expected an Object`, path);

		if (!JSON.isString(data["type"]))
			throw new DefinitionError(`Expected a String`, `${path}.type`);

		const validator = this._normalizedEntries.get(data['type'].toLowerCase());

		if (!validator)
			throw new DefinitionError(`Expected a registered Validator Name`, `${path}.type`);

		return validator.fromJSON(data as { type: string } & Record<string, unknown>, path, this);
	}
}