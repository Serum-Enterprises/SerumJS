import { Result } from '@serum-enterprises/result';
import * as IO from './Connector';
import * as path from 'path';

export class DirectoryEntry extends IO.DirectoryEntry {
	private _isFile: boolean;
	private _name: string;
	private _parentPath: string;

	public constructor(isFile: boolean, name: string, parentPath: string) {
		super();
		this._isFile = isFile;
		this._name = name;
		this._parentPath = parentPath;
	}

	public isFile(): boolean {
		return this._isFile;
	}

	public isDirectory(): boolean {
		return !this._isFile;
	}

	public isBlockDevice(): boolean {
		return false;
	}

	public isCharacterDevice(): boolean {
		return false;
	}

	public isSymbolicLink(): boolean {
		return false;
	}

	public isFIFO(): boolean {
		return false;
	}

	public isSocket(): boolean {
		return false;
	}

	public get name(): string {
		return this._name;
	}

	public get parentPath(): string {
		return this._parentPath;
	}
}

type File = string;
class Directory extends Map<string, File | Directory> { }

export class InMemoryConnector extends IO.Connector {
	private _data: Directory;

	public constructor(rootDir: string, sandbox: boolean = false) {
		super(rootDir, sandbox);
		this._data = new Directory();
	}

	private _walk(pathname: string, create: boolean = false): Result<File | Directory, IO.Error.Error> {
		let pathSegments = pathname.split(path.sep).filter(Boolean);
		let current: File | Directory = this._data;

		for (let i = 0; i < pathSegments.length; i++) {
			if (!(current instanceof Directory))
				return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));

			const name = pathSegments[i] as string;

			if (!current.has(name)) {
				if (!create)
					return Result.Err(new IO.Error.NoEntryError(`Entry '${pathname}' not found or part of the path does not exist`));

				current.set(name, new Directory());
			}

			current = current.get(name)!;
		}

		return Result.Ok(current);
	}

	public readFileSync(filename: string): Result<string, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => {
					return this._walk(pathname)
						.match(
							value => {
								if (value instanceof Directory)
									return Result.Err(new IO.Error.IsDirectoryError(`Entry '${pathname}' is a directory`));

								return Result.Ok(value as string);
							},
							error => Result.Err(error)
						);
				},
				error => Result.Err(error)
			);
	}

	public writeFileSync(filename: string, data: string): Result<void, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => {
					return this._walk(path.dirname(pathname), true)
						.match(
							value => {
								if (!(value instanceof Directory))
									return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));

								const name = path.basename(pathname);
								value.set(name, data);
								return Result.Ok(void 0);
							},
							error => Result.Err(error)
						)
				},
				error => Result.Err(error)
			);
	}

	public appendFileSync(filename: string, data: string): Result<void, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => {
					return this._walk(path.dirname(pathname), true)
						.match(
							value => {
								if (!(value instanceof Directory))
									return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));

								const name = path.basename(pathname);

								if (value.has(name)) {
									const file = value.get(name)!;

									if (file instanceof Directory)
										return Result.Err(new IO.Error.IsDirectoryError(`Entry '${pathname}' is a directory`));

									value.set(name, file + data);
								}
								else
									value.set(name, data);

								return Result.Ok(void 0);
							},
							error => Result.Err(error)
						)
				},
				error => Result.Err(error)
			);
	}

	public deleteFileSync(filename: string): Result<void, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => {
					return this._walk(path.dirname(pathname))
						.match(
							value => {
								if (!(value instanceof Directory))
									return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));

								const name = path.basename(pathname);

								if (!value.has(name))
									return Result.Err(new IO.Error.NoEntryError(`Entry '${pathname}' not found`));

								value.delete(name);
								return Result.Ok(void 0);
							},
							error => Result.Err(error)
						)
				},
				error => Result.Err(error)
			);
	}

	public createDirectorySync(dirname: string): Result<void, IO.Error.Error> {
		return this.resolvePath(dirname)
			.match(
				pathname => {
					return this._walk(pathname, true)
						.match(
							value => {
								if (!(value instanceof Directory))
									return Result.Err(new IO.Error.AlreadyExistsError(`Entry '${pathname}' already exists`));

								return Result.Ok(void 0);
							},
							error => Result.Err(error)
						)
				},
				error => Result.Err(error)
			);
	}

	public readDirectorySync(dirname: string): Result<IO.DirectoryEntry[], IO.Error.Error> {
		return this.resolvePath(dirname)
			.match(
				pathname => {
					return this._walk(pathname)
						.match(
							value => {
								if (!(value instanceof Directory))
									return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' is not a directory`));

								return Result.Ok(Array.from(value.entries()).map(([name, value]) => {
									return new DirectoryEntry(!(value instanceof Directory), name, pathname);
								}));
							},
							error => Result.Err(error)
						)
				},
				error => Result.Err(error)
			);
	}

	public deleteDirectorySync(dirname: string): Result<void, IO.Error.Error> {
		return this.resolvePath(dirname)
			.match(
				pathname => {
					return this._walk(path.dirname(pathname))
						.match(
							value => {
								if (!(value instanceof Directory))
									return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`));

								const name = path.basename(pathname);

								if (!value.has(name))
									return Result.Err(new IO.Error.NoEntryError(`Entry '${pathname}' not found`));

								if (!(value.get(name) instanceof Directory))
									return Result.Err(new IO.Error.NotDirectoryError(`Entry '${pathname}' is not a directory`));

								value.delete(name);
								return Result.Ok(void 0);
							},
							error => Result.Err(error)
						)
				},
				error => Result.Err(error)
			);
	}
}