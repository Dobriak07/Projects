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
const fs_scan_1 = require("./helpers/fs.scan");
const console_log_service_1 = require("./core/console/console.log.service");
const facexSession_1 = require("./core/facex/facexSession");
const pg_service_1 = require("./core/db/pg.service");
const path_1 = __importDefault(require("path"));
const prompt_service_1 = require("./core/prompt/prompt.service");
const pgwrite_1 = require("./core/db/pgwrite");
function app() {
    return __awaiter(this, void 0, void 0, function* () {
        let conf = yield (0, prompt_service_1.startCLI)();
        main(conf);
    });
}
app();
function main(conf, dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let dirScan = dirPath ? dirPath : conf.path;
            let pool = yield (0, pg_service_1.pg)(conf);
            // let client = await pool?.connect();
            let res = yield (0, fs_scan_1.scanDir)(conf, dirScan);
            console.log(dirScan.split(path_1.default.sep).join('/'));
            let processedFiles = yield (pool === null || pool === void 0 ? void 0 : pool.query(`SELECT file FROM log WHERE status=1 AND path='${dirScan.split(path_1.default.sep).join('/')}';`));
            let _files = checkRows(processedFiles === null || processedFiles === void 0 ? void 0 : processedFiles.rows);
            console.log(_files);
            if ((res === null || res === void 0 ? void 0 : res.files.length) != 0 && (res === null || res === void 0 ? void 0 : res.files)) {
                let filesNew = [];
                for (let file of res.files) {
                    if (!_files.includes(path_1.default.basename(file)))
                        filesNew.push(file);
                }
                console.log(filesNew);
                if (filesNew.length != 0) {
                    let uploadRes = yield (0, facexSession_1.uploadSession)(conf, filesNew);
                    if (typeof uploadRes == 'string') {
                        console.log('Returned string');
                        yield (pool === null || pool === void 0 ? void 0 : pool.end());
                    }
                    else if (uploadRes) {
                        yield (0, pgwrite_1.pgLog)(uploadRes, pool);
                    }
                }
            }
            yield (pool === null || pool === void 0 ? void 0 : pool.end());
            if ((res === null || res === void 0 ? void 0 : res.dirs.length) != 0 && (res === null || res === void 0 ? void 0 : res.dirs)) {
                for (let dir of res.dirs) {
                    (0, console_log_service_1.printMessage)(`Switching to ${dir}`);
                    yield main(conf, dir);
                }
            }
        }
        catch (err) {
            if (err)
                console.log(err);
        }
    });
}
function checkRows(rows) {
    let files = [];
    for (let row of rows) {
        files.push(row.file);
    }
    return files;
}
