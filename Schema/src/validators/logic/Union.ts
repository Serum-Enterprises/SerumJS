import * as JSON from '@serum-enterprises/json';
import type {Registry} from '../../Registry';
import {Validator} from '../Validator';
import {
	Definition,
	InferListDefinitionType, InferListReturnType,
	AssertError, DefinitionError
} from '../../util';
import {Option} from "../../util/Option";

export interface UnionValidatorDefinition<
	T extends readonly Definition[] = readonly Definition[]
> extends Definition {
	type: 'union';
	allOf?: T;
}

export class UnionValidator<
	T = unknown,
	TD extends readonly Definition[] = readonly Definition[]
> extends Validator<T> {
	public static override fromJSON(
		definition: Definition & { [key: string]: unknown },
		path: string = 'definition',
		domain: Registry
	): Validator {
		const validatorInstance = new UnionValidator();

		if ('allOf' in definition) {
			if (!JSON.isShallowArray(definition['allOf']))
				throw new DefinitionError(`Expected ${path}.allOf to be an Array`);

			const allOfValidators: Validator[] = [];
			const errors: DefinitionError[] = [];

			definition['allOf'].forEach((allOfDef, index) => {
				try {
					allOfValidators.push(domain.fromJSON(allOfDef, `${path}.allOf[${index}]`));
				} catch (e) {
					if (!(e instanceof DefinitionError))
						throw new DefinitionError(`Fatal Error: Undefined Error thrown by Domain.fromJSON at ${path}`);

					errors.push(e);
				}
			});

			if (errors.length > 0)
				throw new DefinitionError(`Multiple Definition Errors detected at ${path} (see cause)`, {cause: errors});

			validatorInstance.allOf(allOfValidators);
		}

		return validatorInstance;
	}



	public constructor(
		protected _allOf: Option<readonly Validator[]> = Option.None()
	) {
		super();
	}

	public allOf<const T extends readonly Validator[]>(
		validators: T
	): UnionValidator<
		InferListReturnType<T>,
		InferListDefinitionType<T>
	> {
		this._allOf = Option.Some(validators);
		return this as any;
	}

	public override assert(
		data: unknown,
		path: string = 'data'
	): asserts data is T {
		if(!this._allOf.isSome())
			throw new AssertError(`Empty Union at ${path}`);

		const errors: AssertError[] = [];

		for (let i = 0; i < this._allOf.value.length; i++) {
			const validator: Validator = this._allOf.value[i]!;

			try {
				validator.assert(data, path);
			} catch (e) {
				if (!(e instanceof AssertError))
					throw new AssertError(`Fatal Error: Undefined Error thrown by an Assert Method at ${path}`);

				errors.push(new AssertError(`allOf[${i}] failed while asserting ${path} (see cause)`, {cause: e}));
			}
		}

		if (errors.length > 0)
			throw new AssertError(`Multiple Errors while asserting ${path} (see cause)`, {cause: errors});
	}

	public override toJSON(): UnionValidatorDefinition<TD> {
		const definition: UnionValidatorDefinition = {type: 'union'};

		if (this._allOf.isSome())
			definition.allOf = this._allOf.value.map(v => v.toJSON());

		return definition as UnionValidatorDefinition<TD>;
	}
}