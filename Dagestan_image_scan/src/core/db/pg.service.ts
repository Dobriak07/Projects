import { Pool } from 'pg';
import { Conf } from '../types/myTypes';
import { createDB } from './createDB';
import { createTable } from './createTable';

export async function pg(conf:Conf): Promise<any> {
    console.log('Tut');
    const pool = new Pool({
        host: conf.pg_ip,
        port: conf.pg_port,
        user: conf.pg_login,
        password: conf.pg_password,
        database: 'dagestan_face_scan'
    })
    
    try {
        let checkTables = await createTable(conf);
        console.log(checkTables);
        return pool;
    }
    catch(err: unknown) {
        if (typeof err == 'string') {
            console.log(err);
        }
        if (err instanceof Error) {
            console.log(err.message);
            if(err.message.includes('dagestan_face_scan')) {
                await createDB(conf);
                await createTable(conf);
                return pg(conf);
            }
        }
    }
}