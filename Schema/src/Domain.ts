import {JSON} from '@serum-enterprises/json';
import {Validator, ValidatorClass} from "./validators/Validator";
import {UnknownDefinition} from "./lib/types";
import {DefinitionError, DomainError} from "./lib/errors";
import {IntersectValidator, NeverValidator, UnionValidator, UnknownValidator} from "./validators";

export type Registry = Record<string, ValidatorClass>;

type DynamicDomain<R extends Registry> = Domain & R;

export class Domain {
	public static create<const R extends Registry>(
		registry: R,
	): DynamicDomain<R> {
		return new Domain(registry) as DynamicDomain<R>;
	}

	private readonly _registry: Registry;

	public constructor(
		registry: Registry,
	) {
		this._registry = Object.entries(registry).reduce((registry: Registry, [name, validator]) => {
			if (name.length < 1 || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name))
				throw new DomainError("Expected all Validators to be valid JavaScript Identifiers", {
					cause: {name: name}
				});

			if(["Never", "Unknown", "Union", "Intersect", "fromJSON"].includes(name))
				throw new DomainError("Validator is a well-known Validator or existing Method", {
					cause: {name: name}
				});

			if(name.toLowerCase() in registry)
				throw new DomainError("Duplicate lowercase Validator detected", {
					cause: {name: name.toLowerCase()}
				});

			Object.defineProperty(this, name, {
				enumerable: true,
				configurable: false,
				get() {
					return new validator()
				}
			});

			return {...registry, [name.toLowerCase()]: validator};
		}, {});
	}

	public get Never(): NeverValidator {
		return new NeverValidator();
	}

	public get Unknown(): UnknownValidator {
		return new UnknownValidator();
	}

	public get Union(): UnionValidator {
		return new UnionValidator();
	}

	public get Intersect(): IntersectValidator {
		return new IntersectValidator();
	}

	public fromJSON(definition: unknown, path: string = 'definition'): Validator {
		if (!JSON.isShallowObject(definition))
			throw new DefinitionError(`Expected an Object`, path);

		if (!JSON.isString(definition['type']))
			throw new DefinitionError(`Expected a String`, `${path}.type`);

		switch(definition['type']) {
			case 'never':
				return NeverValidator.fromJSON(definition as UnknownDefinition, path, this);
			case 'unknown':
				return UnknownValidator.fromJSON(definition as UnknownDefinition, path, this);
			case 'union':
				return UnionValidator.fromJSON(definition as UnknownDefinition, path, this);
			case 'intersect':
				return IntersectValidator.fromJSON(definition as UnknownDefinition, path, this);
			default:
				const validator = this._registry[definition['type']];

				if(!validator)
					throw new DefinitionError(`Validator not found`, path, {cause: {type: definition['type']}});

				return validator.fromJSON(definition as UnknownDefinition, path, this);
		}
	}
}