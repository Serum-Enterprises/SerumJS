import {JSON} from '@serum-enterprises/json';
import {Validator, ValidatorClass} from "./Validator";
import {UnknownDefinition} from "./lib/types";
import {DefinitionError, DomainError} from "./lib/errors";

type DynamicDomain<
	D extends Record<string, Domain>,
	V extends Record<string, ValidatorClass>
> = Domain & D & {
	readonly [K in keyof V]: V[K] extends ValidatorClass<infer R> ? R : never;
};

export class Domain {
	public static create<
		D extends Record<string, Domain>,
		V extends Record<string, ValidatorClass>
	>(domains: D, validators: V): DynamicDomain<D, V> {
		return new Domain(domains, validators) as DynamicDomain<D, V>;
	}

	public readonly domains: Map<string, Domain> = new Map();
	public readonly validators: Map<string, ValidatorClass> = new Map();

	public constructor(
		domains: Readonly<Record<string, Domain>> = {},
		validators: Readonly<Record<string, ValidatorClass>> = {}
	) {
		for (const [name, domain] of Object.entries(domains)) {
			const lowerCaseName = name.toLowerCase();

			if (this.domains.has(lowerCaseName) || name in this)
				throw new DomainError(`Duplicate Key detected`, {cause: {name}});

			this.domains.set(lowerCaseName, domain);

			Object.defineProperty(this, name, {
				enumerable: true,
				configurable: false,
				get() {
					return domain;
				}
			});
		}

		for (const [name, validator] of Object.entries(validators)) {
			const lowerCaseName = name.toLowerCase();

			if (this.validators.has(lowerCaseName) || name in this)
				throw new DomainError(`Duplicate Key detected`, {cause: {name}});

			this.validators.set(lowerCaseName, validator);

			Object.defineProperty(this, name, {
				enumerable: true,
				configurable: false,
				get() {
					return new validator();
				}
			});
		}
	}

	protected _fromJSON(typeList: [string, ...string[]], definition: UnknownDefinition, path: string, rootDomain: Domain): Validator {
		if (typeList.length > 1) {
			const domain = this.domains.get(typeList[0]);

			if (!domain)
				throw new DefinitionError(`Domain not found for ${typeList[0]}`, path, {cause: definition.type});

			return domain._fromJSON(typeList.slice(1) as [string, ...string[]], definition, path, rootDomain);
		}
		else {
			const validator = this.validators.get(typeList[0]);

			if (!validator)
				throw new DefinitionError(`Validator not found for ${typeList[0]}`, path, {cause: definition.type});

			return validator.fromJSON(definition, path, rootDomain);
		}
	}

	public fromJSON(definition: unknown, path: string = 'definition'): Validator {
		if (!JSON.isShallowObject(definition))
			throw new DefinitionError(`Expected an Object`, path);

		if (!JSON.isString(definition['type']))
			throw new DefinitionError(`Expected a String`, `${path}.type`);

		const typeList = definition['type'].toLowerCase().split('.').filter(Boolean);

		if (typeList.length < 1)
			throw new DefinitionError(`Expected a valid Validator Identifier`, `${path}.type`);

		return this._fromJSON(typeList as [string, ...string[]], definition as UnknownDefinition, path, this);
	}
}