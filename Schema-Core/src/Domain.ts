import type {Validator, ValidatorDefinition} from "./validators/Validator";
import {JSON} from "@serum-enterprises/json";
import {DefinitionError} from "./lib/errors";
import {NeverValidator} from "./validators/core/NeverValidator";
import {UnknownValidator} from "./validators/core/UnknownValidator";
import {IntersectValidator} from "./validators/core/IntersectValidator";
import {UnionValidator} from "./validators/core/UnionValidator";

export interface ValidatorClass<T extends string = string, V extends Validator = Validator> {
	readonly type: T;

	fromJSON(definition: { type: T } & Record<string, JSON>, path: string, domain: Domain): V;

	new(constraints: Readonly<Record<string, never>>): V;
}

type InferValidatorMethods<
	V extends Readonly<Record<string, ValidatorClass>>
> = {
	readonly [K in keyof V]: () => InstanceType<V[K]>;
};

export class Domain<
	V extends Readonly<Record<string, () => Validator>> = {}
> {
	public static create<
		const C extends Readonly<Record<string, ValidatorClass>>
	>(validators: C): Domain<InferValidatorMethods<C>> & InferValidatorMethods<C> {
		return new Domain<InferValidatorMethods<C>>(
			new Map(Object.entries(validators))
		) as Domain<InferValidatorMethods<C>> & InferValidatorMethods<C>;
	}
	protected readonly _validatorsByType: ReadonlyMap<string, ValidatorClass>;

	protected constructor(
		protected readonly _validators: ReadonlyMap<string, ValidatorClass>
	) {
		const validatorsByType: Map<string, ValidatorClass> = new Map();

		for (const [label, validator] of _validators) {
			if (label in this)
				throw new TypeError(`Invalid Label ${label} detected`);

			if (["never", "unknown", "intersect", "union"].includes(validator.type))
				throw new TypeError(`Invalid Type ${validator.type} detected`);

			const registeredValidator = validatorsByType.get(validator.type);

			if (registeredValidator !== undefined && registeredValidator !== validator)
				throw new TypeError(`Type ${validator.type} is already registered by another Validator Class`);

			validatorsByType.set(validator.type, validator);

			Object.defineProperty(this, label, {
				enumerable: true,
				configurable: false,
				writable: false,
				value: () => new validator({})
			});
		}

		this._validatorsByType = validatorsByType;
	}

	public extend<
		const N extends Readonly<Record<string, ValidatorClass>>
	>(
		validators: N
	): Domain<
		Omit<V, keyof N> & InferValidatorMethods<N>
	> & Omit<V, keyof N> & InferValidatorMethods<N> {
		return Domain.create({
			...Object.fromEntries(this._validators.entries()),
			...validators
		}) as Domain<
			Omit<V, keyof N> & InferValidatorMethods<N>
		> & Omit<V, keyof N> & InferValidatorMethods<N>;
	}

	public Never(): NeverValidator {
		return new NeverValidator({});
	}

	public Unknown(): UnknownValidator {
		return new UnknownValidator({});
	}

	public Intersect<const VARIANTS extends readonly [Validator, ...Validator[]]>(variants: VARIANTS): IntersectValidator<{
		readonly variants: readonly [...VARIANTS]
	}> {
		return new IntersectValidator<{ readonly variants: readonly [...VARIANTS] }>({variants: [...variants]});
	}

	public Union<const VARIANTS extends readonly [Validator, ...Validator[]]>(variants: VARIANTS): UnionValidator<{
		readonly variants: readonly [...VARIANTS]
	}> {
		return new UnionValidator<{ readonly variants: readonly [...VARIANTS] }>({variants: [...variants]});
	}

	public fromJSON(definition: unknown, path: string = "definition"): Validator {
		if (!JSON.isObject(definition))
			throw new DefinitionError(`Expected ${path} to be an Object`, path);

		if (!(Object.hasOwn(definition, "type") && typeof definition["type"] === "string"))
			throw new DefinitionError(`Expected ${path}.type to be a String`, `${path}.type`);

		switch (definition["type"]) {
			case "never":
				return NeverValidator.fromJSON(definition as { type: "never" } & Record<string, JSON>, path, this);
			case "unknown":
				return UnknownValidator.fromJSON(definition as { type: "unknown" } & Record<string, JSON>, path, this);
			case "intersect":
				return IntersectValidator.fromJSON(definition as {
					type: "intersect"
				} & Record<string, JSON>, path, this);
			case "union":
				return UnionValidator.fromJSON(definition as { type: "union" } & Record<string, JSON>, path, this);
			default:
				const validator = this._validatorsByType.get(definition["type"]);

				if (!validator)
					throw new DefinitionError(`Validator at ${path} not found`, path, {type: definition["type"]});

				return validator.fromJSON(definition as ValidatorDefinition, path, this);
		}

	}
}
