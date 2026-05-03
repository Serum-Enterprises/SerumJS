import {JSON} from '@serum-enterprises/json';
import {Validator, ValidatorClass} from "./Validator";
import {UnknownDefinition, InferValidatorInstanceType} from "./lib/types";
import {DefinitionError, DomainError} from "./lib/errors";

type DynamicDomain<
	D extends Record<string, Domain>,
	V extends Record<string, ValidatorClass>
> = Domain & D & { readonly [K in keyof V]: InferValidatorInstanceType<V[K]> };

export class Domain {
	public static create<
		D extends Record<string, Domain>,
		V extends Record<string, ValidatorClass>
	>(domains: D, validators: V): DynamicDomain<D, V> {
		return new Domain(domains, validators) as DynamicDomain<D, V>;
	}

	private readonly _identifiers: Map<string, string> = new Map();

	public constructor(
		public readonly domains: Readonly<Record<string, Domain>> = {},
		public readonly validators: Readonly<Record<string, ValidatorClass>> = {}
	) {
		for (const [name, domain] of Object.entries(domains)) {
			this._registerIdentifier(name);

			Object.defineProperty(this, name, {
				enumerable: true,
				configurable: false,
				get() {
					return domain;
				}
			});
		}

		for (const [name, validator] of Object.entries(validators)) {
			this._registerIdentifier(name);

			Object.defineProperty(this, name, {
				enumerable: true,
				configurable: false,
				get() {
					return new validator();
				}
			});
		}
	}

	private _registerIdentifier(id: string): string {
		const normalizedID = id.toLowerCase();

		if (id.length < 1 || this._identifiers.has(normalizedID) || id in this)
			throw new DomainError(`Duplicate or Invalid Identifier detected`, {cause: {id, normalizedID}});

		this._identifiers.set(normalizedID, id);

		return normalizedID;
	}

	public extend<
		ED extends Record<string, Domain>,
		EV extends Record<string, ValidatorClass>
	>(domains: ED, validators: EV): this & ED & { readonly [K in keyof EV]: InferValidatorInstanceType<EV[K]> } {
		return Domain.create(
			{...this.domains, ...domains},
			{...this.validators, ...validators}
		) as this & ED & { readonly [K in keyof EV]: InferValidatorInstanceType<EV[K]> };
	}

	protected _fromJSON(typeList: [string, ...string[]], definition: UnknownDefinition, path: string, rootDomain: Domain): Validator {
		const name = this._identifiers.get(typeList[0]);

		if (name === undefined)
			throw new DefinitionError(`Identifier not found for ${typeList[0]}`, path, {cause: definition.type});

		if (typeList.length > 1) {
			const domain = this.domains[name];

			if (!domain)
				throw new DefinitionError(`Domain not found for ${typeList[0]}`, path, {cause: definition.type});

			return domain._fromJSON(typeList.slice(1) as [string, ...string[]], definition, path, rootDomain);
		}
		else {
			const validator = this.validators[name];

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