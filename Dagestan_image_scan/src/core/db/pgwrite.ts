import { Pool } from "pg";
import { LoggerService } from "../logger/class.logger";

export async function pgLog(results: Map<string, any>, pool: Pool | undefined, logger: LoggerService) {
    try {
        let errStatus = ['no_face', 'upload_problem'];
        // @ts-ignore-start
        for (const [key, value] of results) {
            if (errStatus.includes(value.status)) {
                let res = await pool?.query(
                    `INSERT INTO log (file, path, date, status, success_info, error_info) VALUES ($1, $2, $3, $4, $5, $6);`, 
                    [value.file, value.path, (new Date()).toISOString(), value.code, JSON.stringify(value), value.status]
                );
                logger.debug(`${key} сохранен в БД`);
                results.delete(key);
            } else {
                let res = await pool?.query(
                    `INSERT INTO log (file, path, date, status, success_info) VALUES ($1, $2, $3, $4, $5);`, 
                    [value.file, value.path, (new Date()).toISOString(), value.code, JSON.stringify(value)]
                );
                logger.debug(`${key} сохранен в БД`);
                results.delete(key);
            }
        }
        // @ts-ignore-stop
    }
    catch(err: any) {
        if (err) {
            if (results.size != 0) {
                let files = [ ...results.keys() ];
                throw new Error(`Не удалось записать в БД файлы: ${files}`);
            } else {
                throw err;
            }
        }
    }
}