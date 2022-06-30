import { Pool, PoolClient } from 'pg';
import { Conf } from '../types/myTypes';
import dedent from 'dedent';

export async function pg(conf:Conf) {
    const pool = new Pool({
        host: conf.pg_ip,
        port: conf.pg_port,
        user: conf.pg_login,
        password: conf.pg_password,
        database: 'dagestan_face_scan'
    })
    
    pool.on('error', (err, client) => {
        if (err) console.log(err);
    })

    try {
        const client = await pool.connect();
        let checkTables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema','pg_catalog');`);
        if (checkTables.rows.length == 0) {
            try{
                await createTable(client);
            }
            catch(e) {
                if(e) console.log(e);
            }
        }
        
    }
    catch(err: unknown) {
        if (typeof err == 'string') {
            console.log(err);
        }
        if (err instanceof Error) {
            console.log(err.message);
            if(err.message.includes('dagestan_face_scan')) {
                createDB(conf);
            }
        }
    }
}


async function createDB(conf: Conf) {
    const pool = new Pool({
        host: conf.pg_ip,
        port: conf.pg_port,
        user: conf.pg_login,
        password: conf.pg_password,
        database: 'postgres'
    });

    try {
        let client = await pool.connect();
        await client.query('CREATE DATABASE dagestan_face_scan');
        await pool.end();
    }
    catch(e) {
        console.log(e);
        await pool.end();
    }
}

async function createTable(client: PoolClient) {
    try {
        await client.query(dedent(`
            -- SEQUENCE: public.log_id
    
            DROP SEQUENCE public.log_id;
    
            CREATE SEQUENCE public.log_id
                INCREMENT 1
                START 1
                MINVALUE 1
                MAXVALUE 9223372036854775807
                CACHE 1;
    
            ALTER SEQUENCE public.log_id
                OWNER TO postgres;
        `))
        await client.query(dedent(`
            CREATE TABLE public.log
            (
                id bigint NOT NULL DEFAULT nextval('log_id'::regclass),
                file character varying NOT NULL,
                path character varying NOT NULL,
                date timestamp without time zone NOT NULL,
                status character varying NOT NULL,
                success_info json,
                error_info character varying,
                PRIMARY KEY (id, file, status)
            )
    
            TABLESPACE pg_default;
    
            ALTER TABLE public.log
                OWNER to postgres;
        `));
    }
    catch(e) {
        if(e) throw e;
    }
}