/* eslint-disable no-useless-catch */
import fs from 'fs';

export class FileService {
	isExist(path: string): boolean {
		try {
			fs.statSync(path);
			return true;
		} catch (err) {
			return false;
		}
	}

	writeFile(path: string, data: string): void {
		try {
			fs.writeFileSync(path, data);
		} catch (err) {
			throw err;
		}
	}
}
