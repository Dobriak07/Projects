import { scanDir } from "./helpers/fs.scan";
import { printMessage } from "./core/console/console.log.service";
import { Conf, RowFile } from './core/types/myTypes';
import { DirScan } from "./core/types/myTypes";
import { uploadSession } from "./core/facex/facexSession";
import { pg } from "./core/db/pg.service";
import path from 'path';
import { startCLI } from "./core/prompt/prompt.service";
import { pgLog } from "./core/db/pgwrite";

async function app() {
    let conf = await startCLI();
    main(conf);
}

app();

async function main(conf: Conf, dirPath?: string) {
    try {
        let dirScan:string = dirPath ? dirPath : conf.path;
        let pool = await pg(conf);
        // let client = await pool?.connect();
        let res: DirScan | undefined = await scanDir(conf, dirScan);
        console.log(dirScan.split(path.sep).join('/'));
        let processedFiles = await pool?.query(`SELECT file FROM log WHERE status=1 AND path='${dirScan.split(path.sep).join('/')}';`);
        let _files = checkRows(processedFiles?.rows);
       
        console.log(_files);
        if (res?.files.length != 0 && res?.files) {
            let filesNew: string[] = [];
            for (let file of res.files) {
                if (!_files.includes(path.basename(file))) filesNew.push(file);
            }

            console.log(filesNew);
            if (filesNew.length != 0) {
                let uploadRes = await uploadSession(conf, filesNew);
                if(typeof uploadRes == 'string') {
                    console.log('Returned string');
                    await pool?.end();
                } 
                else if (uploadRes) {
                    await pgLog(uploadRes, pool);
                }
            }
        }
        await pool?.end();

        if (res?.dirs.length != 0 && res?.dirs) {
            for (let dir of res.dirs) {
                printMessage(`Switching to ${dir}`);
                await main(conf, dir);
            }
        }
    }
    catch (err) {
        if (err) console.log(err);
    }
}

function checkRows(rows: RowFile[] | any) {
    let files: string[] = [];
    for (let row of rows) {
        files.push(row.file);
    }
    return files;
}