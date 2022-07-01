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
exports.createDB = void 0;
const pg_1 = require("pg");
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
            yield pool.query('CREATE DATABASE dagestan_face_scan');
            yield pool.end();
            return 'БД создана';
        }
        catch (err) {
            if (err) {
                yield pool.end();
                throw err;
            }
        }
    });
}
exports.createDB = createDB;
