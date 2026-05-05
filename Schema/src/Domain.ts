import {JSON} from '@serum-enterprises/json';
import {Validator, ValidatorClass} from "./Validator";
import {UnknownDefinition} from "./lib/types";
import {DefinitionError, DomainError} from "./lib/errors";
import {Operations} from "./lib/Operations";
import {IntersectValidator, NeverValidator, UnionValidator, UnknownValidator} from "./validators";

export type ReadonlyValidatorRegistry = {
	readonly validators: Readonly<Record<string, ValidatorClass>>;
};

type DynamicDomain<R extends Readonly<Record<string, ReadonlyValidatorRegistry>>> = Domain & R;

export class Domain {
	public static create<const R extends Readonly<Record<string, ReadonlyValidatorRegistry>>>(
		registries: R,
		operations: readonly Operations[],
	): DynamicDomain<R> {
		return new Domain(registries, operations) as DynamicDomain<R>;
	}

	private readonly _registry: Map<string, ValidatorClass> = new Map();
	private readonly _operations: Operations;

	public constructor(
		validatorRegistries: Readonly<Record<string, ReadonlyValidatorRegistry>>,
		operations: readonly Operations[]
	) {
		for (const [registryName, validatorRegistry] of Object.entries(validatorRegistries)) {
			const registryID = registryName.toLowerCase();

			if (registryID.length < 1 || registryID in this || registryName in this)
				throw new DomainError(`Invalid Registry Identifier detected`, {
					cause: {name: registryName, normalized: registryID}
				});

			for (const [validatorName, validator] of Object.entries(validatorRegistry.validators)) {
				const validatorID = validatorName.toLowerCase();
				const compositeID = `${registryID}.${validatorID}`;

				if (validatorID.length < 1)
					throw new DomainError(`Invalid Validator Identifier detected`, {
						cause: {original: validatorName, normalized: validatorID}
					});

				if (this._registry.has(compositeID))
					throw new DomainError(`Duplicate Composite Identifier detected`, {
						cause: {registry: registryName, validator: validatorName, composite: compositeID}
					});

				this._registry.set(`${registryID}.${validatorID}`, validator);
			}

			Object.defineProperty(this, registryName, {
				enumerable: true,
				configurable: false,
				get() {
					return validatorRegistry
				}
			});
		}

		this._operations = Operations.merge(operations);
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

	public normalize(validator: Validator): Validator {
		return this._operations.normalize(validator);
	}
	public merge(a: Validator, b: Validator): Validator {
		return this._operations.merge(a, b);
	}
	public isEqual(a: Validator, b: Validator): boolean {
		return this._operations.isEqual(a, b);
	}
	public isSubset(a: Validator, b: Validator): boolean {
		return this._operations.isSubset(a, b);
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
				const validator = this._registry.get(definition['type']);

				if(!validator)
					throw new DefinitionError(`Validator not found`, path, {cause: {type: definition['type']}});

				return validator.fromJSON(definition as UnknownDefinition, path, this);
		}
	}
}