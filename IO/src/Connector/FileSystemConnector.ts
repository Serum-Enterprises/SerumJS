import { Result } from '@serum-enterprises/result';
import * as IO from './Connector';
import * as fs from 'fs';

export function convertError(error: NodeJS.ErrnoException, pathname: string): IO.Error.Error {
	switch (error.code) {
		case 'ENOENT':
			return new IO.Error.NoEntryError(`Entry '${pathname}' not found or part of the path does not exist`);
		case 'EISDIR':
			return new IO.Error.IsDirectoryError(`Entry '${pathname}' is a directory`);
		case 'ENOTDIR':
			return new IO.Error.NotDirectoryError(`Entry '${pathname}' or part of the path is not a directory`);
		case 'EEXIST':
			return new IO.Error.AlreadyExistsError(`Entry '${pathname}' already exists`);
		case 'EINVAL':
			return new IO.Error.InvalidArgumentError(`Invalid argument for entry '${pathname}'`);
		default:
			return new IO.Error.Error(error.message);
	}
}

class DirectoryEntry extends IO.DirectoryEntry {
	private _dirent: fs.Dirent;

	public constructor(dirent: fs.Dirent) {
		super();
		this._dirent = dirent;
	}

	public isFile(): boolean {
		return this._dirent.isFile();
	}

	public isDirectory(): boolean {
		return this._dirent.isDirectory();
	}

	public isBlockDevice(): boolean {
		return this._dirent.isBlockDevice();
	}

	public isCharacterDevice(): boolean {
		return this._dirent.isCharacterDevice();
	}

	public isSymbolicLink(): boolean {
		return this._dirent.isSymbolicLink();
	}

	public isFIFO(): boolean {
		return this._dirent.isFIFO();
	}

	public isSocket(): boolean {
		return this._dirent.isSocket();
	}

	public get name(): string {
		return this._dirent.name;
	}

	public get parentPath(): string {
		return this._dirent.parentPath;
	}
}

export class FileSystemConnector extends IO.Connector {
	readFileSync(filename: string): Result<string, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => Result.attempt<string, NodeJS.ErrnoException>(() => fs.readFileSync(pathname, 'utf8'))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}

	writeFileSync(filename: string, data: string): Result<void, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => Result.attempt<void, NodeJS.ErrnoException>(() => fs.writeFileSync(pathname, data))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}

	appendFileSync(filename: string, data: string): Result<void, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => Result.attempt<void, NodeJS.ErrnoException>(() => fs.appendFileSync(pathname, data))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}

	deleteFileSync(filename: string): Result<void, IO.Error.Error> {
		return this.resolvePath(filename)
			.match(
				pathname => Result.attempt<void, NodeJS.ErrnoException>(() => fs.unlinkSync(pathname))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}

	createDirectorySync(dirname: string): Result<void, IO.Error.Error> {
		return this.resolvePath(dirname)
			.match(
				pathname => Result.attempt<void, NodeJS.ErrnoException>(() => fs.mkdirSync(pathname, { recursive: true }))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}

	readDirectorySync(dirname: string): Result<DirectoryEntry[], IO.Error.Error> {
		return this.resolvePath(dirname)
			.match(
				pathname => Result.attempt<fs.Dirent[], NodeJS.ErrnoException>(() => fs.readdirSync(pathname, { withFileTypes: true }))
					.mapOk(entries => entries.map(dirent => new DirectoryEntry(dirent)))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}

	deleteDirectorySync(dirname: string): Result<void, IO.Error.Error> {
		return this.resolvePath(dirname)
			.match(
				pathname => Result.attempt<void, NodeJS.ErrnoException>(() => fs.rmSync(pathname, { recursive: true, force: true }))
					.mapErr(error => convertError(error, pathname)),
				error => Result.Err(error)
			);
	}
}
