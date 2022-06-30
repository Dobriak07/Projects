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
const config_handler_1 = require("./helpers/config.handler");
const prompt_service_1 = require("./core/prompt/prompt.service");
const promt_check_1 = require("./helpers/promt.check");
const fs_scan_1 = require("./helpers/fs.scan");
const console_log_service_1 = require("./core/console/console.log.service");
const facexapi_1 = require("./core/facex/facexapi");
const pg_service_1 = require("./core/db/pg.service");
const START_OPTIONS = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
};
const prompt = new prompt_service_1.Prompt();
startCLI();
function startCLI() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, config_handler_1.checkConfig)();
        let { answer } = yield prompt.input([
            {
                type: 'list',
                name: 'answer',
                message: 'Выберите действие',
                choices: [START_OPTIONS.execute, START_OPTIONS.setup]
            }
        ]);
        if (answer === START_OPTIONS.setup) {
            let input = yield prompt.input([
                {
                    type: 'input',
                    name: 'ip',
                    message: 'Введите IP-адрес сервера FaceX',
                    default: '127.0.0.1',
                    validate: promt_check_1.checkIP
                },
                {
                    type: 'number',
                    name: 'port',
                    message: 'Введите порт сервера FaceX',
                    default: '21093',
                    validate: promt_check_1.checkPort
                },
                {
                    type: 'input',
                    name: 'list_name',
                    message: 'Введите имя Контрольного списка FaceX',
                    default: 'Image_scan',
                    validate: promt_check_1.checkFaceListName
                },
                {
                    type: 'input',
                    name: 'pg_ip',
                    message: 'Введите IP-адрес PostgreSQL',
                    default: '127.0.0.1',
                    validate: promt_check_1.checkIP
                },
                {
                    type: 'number',
                    name: 'pg_port',
                    message: 'Введите порт PostgreSQL',
                    default: '5432',
                    validate: promt_check_1.checkPort
                },
                {
                    type: 'input',
                    name: 'pg_login',
                    message: 'Введите логин PostgreSQL',
                    default: 'postgres',
                },
                {
                    type: 'input',
                    name: 'pg_password',
                    message: 'Введите пароль PostgreSQL',
                    default: 'postgres',
                },
                {
                    type: 'input',
                    name: 'path',
                    message: 'Укажите путь до папки для сканирования',
                    validate: promt_check_1.checkPath
                },
                {
                    type: 'checkbox',
                    name: 'extensions',
                    message: 'Выберите расширения файлов для сканирования',
                    default: ['.jpg', '.jpeg'],
                    choices: ['.jpg', '.jpeg', '.png', '.tiff', '.heic', '.heif']
                }
            ]);
            console.log(input);
            yield (0, config_handler_1.saveConfig)(input);
            startCLI();
        }
        else {
            let conf = yield (0, config_handler_1.readConfig)();
            if (conf == 'bad' || typeof conf == 'string') {
                console.log('Ошибка загрузки из конфигурационного файла');
                startCLI();
            }
            else if (!conf) {
                console.log('No config');
            }
            else {
                let pgRes = yield (0, pg_service_1.pg)(conf);
                console.log(pgRes);
            }
            // main(conf);
        }
    });
}
function main(conf, dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let res = dirPath ? yield (0, fs_scan_1.scanDir)(conf, dirPath) : yield (0, fs_scan_1.scanDir)(conf);
            if ((res === null || res === void 0 ? void 0 : res.files.length) != 0 && (res === null || res === void 0 ? void 0 : res.files)) {
                yield (0, facexapi_1.uploadSession)(conf, res.files);
            }
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
