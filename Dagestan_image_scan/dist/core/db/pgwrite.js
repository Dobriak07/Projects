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
exports.pgLog = void 0;
function pgLog(results, pool) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let errStatus = ['no_face', 'upload_problem'];
            // @ts-ignore-start
            for (const [key, value] of results) {
                if (errStatus.includes(value.status)) {
                    let res = yield (pool === null || pool === void 0 ? void 0 : pool.query(`INSERT INTO log (file, path, date, status, success_info, error_info) VALUES ($1, $2, $3, $4, $5, $6);`, [value.file, value.path, (new Date()).toISOString(), value.code, JSON.stringify(value), value.status]));
                    results.delete(key);
                }
                else {
                    let res = yield (pool === null || pool === void 0 ? void 0 : pool.query(`INSERT INTO log (file, path, date, status, success_info) VALUES ($1, $2, $3, $4, $5);`, [value.file, value.path, (new Date()).toISOString(), value.code, JSON.stringify(value)]));
                    results.delete(key);
                }
            }
            // @ts-ignore-stop
        }
        catch (e) {
            if (results.size != 0) {
                yield pgLog(results, pool);
            }
            console.log(e);
        }
    });
}
exports.pgLog = pgLog;
