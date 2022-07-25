/* eslint-disable no-useless-catch */
import e from 'express';
import fs from 'fs';
import path from 'path';

export class FileService {
	isExist(path: string): boolean {
		try {
			fs.statSync(path);
			return true;
		} catch (err) {
			return false;
		}
	}

	writeFile(pathToFile: string, data: string): void {
		try {
			if (this.isExist(pathToFile)) {
				fs.writeFileSync(pathToFile, data);
			} else {
				fs.mkdirSync(path.dirname(pathToFile), { recursive: true });
				fs.writeFileSync(pathToFile, data);
			}
		} catch (err) {
			throw err;
		}
	}
}
