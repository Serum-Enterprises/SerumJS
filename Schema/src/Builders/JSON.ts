import {JSON} from '@serum-enterprises/json';
import {JSONValidator} from '../Validators/JSON';

export class JSONBuilder<T extends JSON.JSON = JSON.JSON> extends JSONValidator<T> {}