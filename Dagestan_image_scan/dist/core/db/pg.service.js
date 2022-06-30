"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pg = void 0;
const pg_1 = require("pg");
const dedent_1 = __importDefault(require("dedent"));
function pg(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new pg_1.Pool({
            host: conf.pg_ip,
            port: conf.pg_port,
            user: conf.pg_login,
            password: conf.pg_password,
            database: 'dagestan_face_scan'
        });
        pool.on('error', (err, client) => {
            if (err)
                console.log(err);
        });
        try {
            const client = yield pool.connect();
            let checkTables = yield client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema','pg_catalog');`);
            if (checkTables.rows.length == 0) {
                try {
                    yield createTable(client);
                }
                catch (e) {
                    if (e)
                        console.log(e);
                }
            }
        }
        catch (err) {
            if (typeof err == 'string') {
                console.log(err);
            }
            if (err instanceof Error) {
                console.log(err.message);
                if (err.message.includes('dagestan_face_scan')) {
                    createDB(conf);
                }
            }
        }
    });
}
exports.pg = pg;
function createDB(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new pg_1.Pool({
            host: conf.pg_ip,
            port: conf.pg_port,
            user: conf.pg_login,
            password: conf.pg_password,
            database: 'postgres'
        });
        try {
            let client = yield pool.connect();
            yield client.query('CREATE DATABASE dagestan_face_scan');
            yield pool.end();
        }
        catch (e) {
            console.log(e);
            yield pool.end();
        }
    });
}
function createTable(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.query((0, dedent_1.default)(`
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
        `));
            yield client.query((0, dedent_1.default)(`
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
        catch (e) {
            if (e)
                throw e;
        }
    });
}
