import dedent from "dedent";
import { Conf } from "../types/myTypes";
import { Pool } from 'pg';

export async function createTable(conf: Conf) {
    try {
        const pool = new Pool({
            host: conf.pg_ip,
            port: conf.pg_port,
            user: conf.pg_login,
            password: conf.pg_password,
            database: 'dagestan_face_scan'
        })

        let seqCreate = await pool.query(dedent(`
            -- SEQUENCE: public.log_id
    
            -- DROP SEQUENCE public.log_id;
    
            CREATE SEQUENCE IF NOT EXISTS public.log_id
                INCREMENT 1
                START 1
                MINVALUE 1
                MAXVALUE 9223372036854775807
                CACHE 1;
    
            ALTER SEQUENCE public.log_id
                OWNER TO postgres;
        `));
        // console.log('Sequence',seqCreate);

        let tableCreate = await pool.query(dedent(`
            CREATE TABLE IF NOT EXISTS public.log
            (
                id bigint NOT NULL DEFAULT nextval('log_id'::regclass),
                file character varying NOT NULL,
                path character varying NOT NULL,
                date timestamp without time zone NOT NULL,
                status bigint NOT NULL,
                success_info json,
                error_info character varying,
                PRIMARY KEY (id, file, status)
            )
    
            TABLESPACE pg_default;
    
            ALTER TABLE public.log
                OWNER to postgres;
        `));
        
        // console.log('Table', tableCreate);
        await pool.end();
    }
    catch(e) {
        if(e) throw e;
    }
}