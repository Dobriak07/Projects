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
const facexSession_1 = require("./core/facex/facexSession");
const pg_service_1 = require("./core/db/pg.service");
const path_1 = __importDefault(require("path"));
const prompt_service_1 = require("./core/cli/prompt.service");
const pgwrite_1 = require("./core/db/pgwrite");
const log_config_handler_1 = require("./helpers/log.config.handler");
const class_logger_1 = require("./core/logger/class.logger");
const delay = (ms) => __awaiter(void 0, void 0, void 0, function* () { return yield new Promise(resolve => setTimeout(resolve, ms)); });
function app() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let start = yield (0, prompt_service_1.startOnGoodConfig)();
            if ((start === null || start === void 0 ? void 0 : start.start) == 1) {
                let conf = yield (0, prompt_service_1.startCLI)();
                const loggerConf = yield (0, log_config_handler_1.logConfig)();
                const logger = new class_logger_1.LoggerService(loggerConf);
                loopMain(conf, logger);
            }
            else if ((start === null || start === void 0 ? void 0 : start.start) == 0) {
                const loggerConf = yield (0, log_config_handler_1.logConfig)();
                const logger = new class_logger_1.LoggerService(loggerConf);
                loopMain(start === null || start === void 0 ? void 0 : start.conf, logger);
            }
            else if ((start === null || start === void 0 ? void 0 : start.start) == 3) {
                const loggerConf = yield (0, log_config_handler_1.logConfig)();
                const logger = new class_logger_1.LoggerService(loggerConf);
                loopMain(start === null || start === void 0 ? void 0 : start.conf, logger);
            }
        }
        catch (err) {
            if (err) {
                console.log(err.message);
            }
        }
    });
}
app();
function loopMain(conf, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let i = 1;
            while (i > 0) {
                logger.info(`?????????? ?????????? ${i}`);
                yield main(conf, logger);
                let t = 30;
                while (t != 0) {
                    process.stdout.write(`?????????????????? ???????????????????????? ???????????????? ?????????? ${t}??    \r`);
                    yield delay(1000);
                    t--;
                }
                i++;
            }
        }
        catch (err) {
            if (err)
                logger.error(err.message);
        }
    });
}
function main(conf, logger, dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let dirScan = dirPath ? dirPath : conf.path;
            let pool = yield (0, pg_service_1.pg)(conf, logger);
            // let client = await pool?.connect();
            let res = yield (0, fs_scan_1.scanDir)(conf, dirScan);
            logger.info(`?????????????? ????????????????????: ${dirScan.split(path_1.default.sep).join('/')}`);
            let processedFiles = yield (pool === null || pool === void 0 ? void 0 : pool.query(`SELECT file FROM log WHERE status=1 AND path='${dirScan.split(path_1.default.sep).join('/')}';`));
            let _files = checkRows(processedFiles === null || processedFiles === void 0 ? void 0 : processedFiles.rows);
            logger.trace('?????????? ???????????????????????? ??????????:', _files);
            if ((res === null || res === void 0 ? void 0 : res.files.length) != 0 && (res === null || res === void 0 ? void 0 : res.files)) {
                let filesNew = [];
                for (let file of res.files) {
                    if (!_files.includes(path_1.default.basename(file)))
                        filesNew.push(file);
                }
                logger.trace('?????????? ?????? ??????????????????:', filesNew);
                if (filesNew.length != 0) {
                    let uploadRes = yield (0, facexSession_1.uploadSession)(conf, filesNew, logger);
                    if (typeof uploadRes == 'string') {
                        yield (pool === null || pool === void 0 ? void 0 : pool.end());
                    }
                    else if (uploadRes) {
                        logger.info(`?????????????????? ???????????????????? ?? ????, ?????????? ?????????????????? ${uploadRes.size} ??????????????`);
                        yield (0, pgwrite_1.pgLog)(uploadRes, pool, logger);
                    }
                }
            }
            yield (pool === null || pool === void 0 ? void 0 : pool.end());
            if ((res === null || res === void 0 ? void 0 : res.dirs.length) != 0 && (res === null || res === void 0 ? void 0 : res.dirs)) {
                for (let dir of res.dirs) {
                    logger.info(`Switching to ${dir}`);
                    yield main(conf, logger, dir);
                }
            }
        }
        catch (err) {
            if (err instanceof Error) {
                logger.error(err.message);
            }
            else if (typeof err == 'string') {
                logger.error(err);
            }
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
