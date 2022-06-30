import fs from 'fs';
import path from 'path';
import { Conf, DirScan } from '../core/types/myTypes';


export async function scanDir(conf:Conf, dirPath: string): Promise<DirScan | undefined> {
    const EXTENSIONS = conf.extensions;
    let result: DirScan = { dirs: [], files: []};
    try {
        let dir = await fs.promises.readdir(path.normalize(dirPath));
        dir.forEach( (el) => {
            if (fs.statSync(path.join(dirPath, el)).isDirectory()) {
                result.dirs.push(path.join(dirPath, el).split(path.sep).join('/'));
            }
            else if (EXTENSIONS.includes(path.extname(el))) {
                result.files.push(path.join(dirPath, el).split(path.sep).join('/'));
            }
        })
        return result;
    }
    catch (err) {
        if(err) throw err;
    }
};

