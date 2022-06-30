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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pg = void 0;
const pg_1 = require("pg");
const createDB_1 = require("./createDB");
const createTable_1 = require("./createTable");
function pg(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Tut');
        const pool = new pg_1.Pool({
            host: conf.pg_ip,
            port: conf.pg_port,
            user: conf.pg_login,
            password: conf.pg_password,
            database: 'dagestan_face_scan'
        });
        try {
            let checkTables = yield (0, createTable_1.createTable)(conf);
            console.log(checkTables);
            return pool;
        }
        catch (err) {
            if (typeof err == 'string') {
                console.log(err);
            }
            if (err instanceof Error) {
                console.log(err.message);
                if (err.message.includes('dagestan_face_scan')) {
                    yield (0, createDB_1.createDB)(conf);
                    yield (0, createTable_1.createTable)(conf);
                    return pg(conf);
                }
            }
        }
    });
}
exports.pg = pg;
