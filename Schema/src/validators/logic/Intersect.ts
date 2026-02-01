import {JSON} from '../../util/JSON';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {
	Definition,
	InferListDefinitionType, InferListReturnType,
	AssertError, DefinitionError
} from '../../util';
import {Option} from "../../util/Option";

export interface IntersectValidatorDefinition<
	T extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'intersect';
	oneOf?: T;
}

export class IntersectValidator<
	// V is the inferred "oneOf" validator tuple output (union of element outputs)
	T = unknown,
	// VD is the inferred tuple of validator definitions
	TD extends readonly Definition[] = readonly Definition[]
> extends Validator<T> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition',
		domain: Registry
	): Validator {
		const validatorInstance = new IntersectValidator();

		if ('oneOf' in definition) {
			if (!JSON.isShallowArray(definition['oneOf']))
				throw new DefinitionError(`Expected ${path}.oneOf to be an Array`);

			const oneOfValidators: Validator[] = [];
			const errors: DefinitionError[] = [];

			definition['oneOf'].forEach((oneOfDef, index) => {
				try {
					oneOfValidators.push(domain.fromJSON(oneOfDef, `${path}.oneOf[${index}]`));
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}`);

					errors.push(e);
				}
			});

			if (errors.length > 0)
				throw new DefinitionError(`Multiple Definition Errors detected at ${path} (see cause)`, {cause: errors});

			validatorInstance.oneOf(oneOfValidators);
		}

		return validatorInstance;
	}

	public constructor(
		protected _oneOf: Option<readonly Validator[]> = Option.None()
	) {
		super();
	}

	public oneOf<const T extends readonly Validator[]>(
		validators: T
	): IntersectValidator<
		InferListReturnType<T>,
		InferListDefinitionType<T>
	> {
		this._oneOf = Option.Some(validators);

		return this as any;
	}

	public override assert(
		data: unknown,
		path: string = 'data'
	): asserts data is T {
		if(!this._oneOf.isSome())
			throw new AssertError(`Empty Intersect at ${path}`);

		const errors: AssertError[] = [];

		for (let i = 0; i < this._oneOf.value.length; i++) {
			const validator: Validator = this._oneOf.value[i]!;

			try {
				validator.assert(data, path);

				return;
			} catch (e) {
				if (!(e instanceof AssertError))
					throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}`);

				errors.push(new AssertError(`oneOf[${i}] failed while asserting ${path} (see cause)`, {cause: e}));
			}
		}

		throw new AssertError(
			`Expected ${path} to match at least one schema in oneOf (see cause)`,
			{cause: errors}
		);
	}

	public override toJSON(): IntersectValidatorDefinition<TD> {
		const definition: IntersectValidatorDefinition = {type: 'intersect'};

		if (this._oneOf.isSome())
			definition.oneOf = this._oneOf.value.map(v => v.toJSON());

		return definition as IntersectValidatorDefinition<TD>;
	}
}