import { Pool } from 'pg';
import { LoggerService } from '../logger/class.logger';
import { Conf } from '../types/myTypes';
import { createDB } from './createDB';
import { createTable } from './createTable';

export async function pg(conf:Conf, logger: LoggerService): Promise<any> {
    const pool = new Pool({
        host: conf.pg_ip,
        port: conf.pg_port,
        user: conf.pg_login,
        password: conf.pg_password,
        database: 'dagestan_face_scan'
    })
    
    try {
        let checkTables = await createTable(conf);
        if (checkTables) {
            logger.debug(checkTables);
        }
        return pool;
    }
    catch(err: unknown) {
        if (typeof err == 'string') {
            throw err;
        }
        if (err instanceof Error) {
            // console.log(err.message);
            if(err.message.includes('dagestan_face_scan')) {
                try {
                    let dbCreate = await createDB(conf);
                    if (dbCreate) logger.debug(dbCreate);
    
                    let tableCreate = await createTable(conf);
                    if (tableCreate) logger.debug(tableCreate);
                    return pg(conf, logger);
                }
                catch(err) {
                    throw err;
                }
            }
        }
    }
}