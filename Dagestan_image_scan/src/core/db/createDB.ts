import { Conf } from "../types/myTypes";
import { Pool } from 'pg';

export async function createDB(conf: Conf) {
    const pool = new Pool({
        host: conf.pg_ip,
        port: conf.pg_port,
        user: conf.pg_login,
        password: conf.pg_password,
        database: 'postgres'
    });

    try {
        await pool.query('CREATE DATABASE dagestan_face_scan');
        await pool.end();
        return 'БД создана';
    }
    catch(err) {
        if (err) {
            await pool.end();
            throw err;
        }
    }
}