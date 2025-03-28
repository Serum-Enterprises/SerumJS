import { Result } from '@serum-enterprises/result';
import * as path from 'path';

export namespace Error {
	export class Error extends globalThis.Error { }

	export class NoEntryError extends Error { }
	export class IsDirectoryError extends Error { }
	export class NotDirectoryError extends Error { }
	export class AlreadyExistsError extends Error { }
	export class InvalidArgumentError extends Error { }
}

export abstract class DirectoryEntry {
	public abstract isFile(): boolean;
	public abstract isDirectory(): boolean;
	public abstract isBlockDevice(): boolean;
	public abstract isCharacterDevice(): boolean;
	public abstract isSymbolicLink(): boolean;
	public abstract isFIFO(): boolean;
	public abstract isSocket(): boolean;
	public abstract get name(): string;
	public abstract get parentPath(): string;
}

export abstract class Connector {
	protected _workingDir: string;
	protected _sandbox: boolean;

	public constructor(workingDir: string, sandbox: boolean) {
		this._workingDir = path.isAbsolute(workingDir) ? workingDir : path.resolve(workingDir);
		this._sandbox = sandbox;
	}

	public get rootDir(): string {
		return this._workingDir;
	}

	public get isSandboxed(): boolean {
		return this._sandbox;
	}

	public resolvePath(pathname: string): Result<string, Error.InvalidArgumentError> {
		const resolvedPath = path.resolve(this._workingDir, pathname);

		if (this._sandbox && !resolvedPath.startsWith(this._workingDir))
			return Result.Err(new Error.InvalidArgumentError(`Invalid path: ${pathname} points outside of the sandbox.`));

		return Result.Ok(resolvedPath);
	}

	public abstract readFileSync(filename: string): Result<string, Error.Error>;
	public abstract writeFileSync(filename: string, data: string): Result<void, Error.Error>;
	public abstract appendFileSync(filename: string, data: string): Result<void, Error.Error>;
	public abstract deleteFileSync(filename: string): Result<void, Error>;

	public abstract createDirectorySync(dirname: string): Result<void, Error.Error>;
	public abstract readDirectorySync(dirname: string): Result<DirectoryEntry[], Error.Error>;
	public abstract deleteDirectorySync(dirname: string): Result<void, Error.Error>;
}