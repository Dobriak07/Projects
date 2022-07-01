import { scanDir } from "./helpers/fs.scan";
import { Conf, RowFile } from './core/types/myTypes';
import { DirScan } from "./core/types/myTypes";
import { uploadSession } from "./core/facex/facexSession";
import { pg } from "./core/db/pg.service";
import path from 'path';
import { startCLI } from "./core/cli/prompt.service";
import { pgLog } from "./core/db/pgwrite";
import { logConfig } from "./helpers/log.config.handler";
import { LoggerService } from "./core/logger/class.logger";

async function app() {
    try {
        let conf = await startCLI();
        const loggerConf = await logConfig();
        const logger = new LoggerService(loggerConf);
        main(conf, logger);
    }
    catch(err: any) {
        if (err) {
            console.log(err.message);
        }
    }
}

app();

async function main(conf: Conf, logger: LoggerService, dirPath?: string) {
    try {
        let dirScan:string = dirPath ? dirPath : conf.path;
        let pool = await pg(conf, logger);
        // let client = await pool?.connect();
        let res: DirScan | undefined = await scanDir(conf, dirScan);
        logger.info(`Текущая директория: ${dirScan.split(path.sep).join('/')}`);
        let processedFiles = await pool?.query(`SELECT file FROM log WHERE status=1 AND path='${dirScan.split(path.sep).join('/')}';`);
        let _files = checkRows(processedFiles?.rows);
       
        logger.trace('Ранее обработанные файлы:', _files);
        if (res?.files.length != 0 && res?.files) {
            let filesNew: string[] = [];
            for (let file of res.files) {
                if (!_files.includes(path.basename(file))) filesNew.push(file);
            }
            logger.trace('Файды под обработку:', filesNew);

            if (filesNew.length != 0) {
                let uploadRes = await uploadSession(conf, filesNew, logger);
                if(typeof uploadRes == 'string') {
                    await pool?.end();
                } 
                else if (uploadRes) {
                    logger.info(`Сохраняем результаты в БД, будет добавлено ${uploadRes.size} записей`);
                    await pgLog(uploadRes, pool, logger);
                }
            }
        }
        await pool?.end();

        if (res?.dirs.length != 0 && res?.dirs) {
            for (let dir of res.dirs) {
                logger.info(`Switching to ${dir}`);
                await main(conf, logger, dir);
            }
        }
    }
    catch (err: unknown) {
        if (err instanceof Error) {
            console.log('Tut');
            logger.error(err.message);
        }
        else if (typeof err == 'string' ){
            console.log('Tut');
            logger.error(err);
        }
    }
}

function checkRows(rows: RowFile[] | any) {
    let files: string[] = [];
    for (let row of rows) {
        files.push(row.file);
    }
    return files;
}