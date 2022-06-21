import fs from 'fs';
import path from 'path';

export const EXTENSIONS = ['.jpg', '.jpeg', '.json', '.js'];

export type DirScan = {
    dirs: string[],
    files: string[]
}

export async function scanDir(dirPath:string): Promise<DirScan | undefined> {
    let result: DirScan = { dirs: [], files: []};
    try {
        let dir = await fs.promises.readdir(path.normalize(dirPath));
        dir.forEach( (el) => {
            if (fs.statSync(path.join(dirPath, el)).isDirectory()) {
                result.dirs.push(path.join(dirPath, el));
            }
            else if (EXTENSIONS.includes(path.extname(el))) {
                result.files.push(path.join(dirPath, el));
            }
        })
        return result;
    }
    catch (err) {
        if(err) throw err;
    }
};

