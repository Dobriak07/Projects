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
exports.createTable = void 0;
const dedent_1 = __importDefault(require("dedent"));
const pg_1 = require("pg");
function createTable(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = new pg_1.Pool({
                host: conf.pg_ip,
                port: conf.pg_port,
                user: conf.pg_login,
                password: conf.pg_password,
                database: 'dagestan_face_scan'
            });
            let seqCreate = yield pool.query((0, dedent_1.default)(`
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
            let tableCreate = yield pool.query((0, dedent_1.default)(`
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
            yield pool.end();
            return 'Таблица создана или существует';
        }
        catch (err) {
            if (err)
                throw err;
        }
    });
}
exports.createTable = createTable;
