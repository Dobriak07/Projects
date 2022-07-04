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
exports.startOnGoodConfig = exports.startCLI = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const config_handler_1 = require("../../helpers/config.handler");
const promt_options_1 = require("./promt.options");
const readline_1 = __importDefault(require("readline"));
const delay = (ms) => __awaiter(void 0, void 0, void 0, function* () { return yield new Promise(resolve => setTimeout(resolve, ms)); });
class Prompt {
    constructor() {
        this.bottomBar = new inquirer_1.default.ui.BottomBar();
    }
    input(questions) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield inquirer_1.default.prompt(questions);
            return result;
        });
    }
    ;
}
function startCLI() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prompt = new Prompt();
            let configCheck = yield (0, config_handler_1.checkConfig)();
            console.log(configCheck);
            let { answer } = yield prompt.input(promt_options_1.promptStart);
            if (answer === promt_options_1.START_OPTIONS.setup) {
                let input = yield prompt.input(promt_options_1.promptQuestions);
                console.log(input);
                let configSave = yield (0, config_handler_1.saveConfig)(input);
                console.log(configSave);
                return (startCLI());
            }
            else {
                let conf = yield (0, config_handler_1.readConfig)();
                if (conf == 'bad' || typeof conf == 'string') {
                    console.log('Ошибка загрузки из конфигурационного файла');
                    return (startCLI());
                }
                else if (!conf) {
                    console.log('Конфигурационный файл не найден');
                }
                else {
                    let conf = yield (0, config_handler_1.readConfig)();
                    return (conf);
                }
            }
        }
        catch (err) {
            throw err;
        }
    });
}
exports.startCLI = startCLI;
function startOnGoodConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        let configCheck = yield (0, config_handler_1.checkConfig)();
        let conf = yield (0, config_handler_1.readConfig)();
        if (configCheck == 'Конфигурация найдена') {
            console.log('Конфигурация найдена');
            // console.log('Start in 10 sec');
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let status = 0;
                readline_1.default.emitKeypressEvents(process.stdin);
                // let start = setTimeout(() => {
                //     resolve({start: 0, conf: conf});
                // }, 5000);
                process.stdin.setRawMode(true);
                process.stdin.on('keypress', (str, key) => {
                    if (key.ctrl && key.name === 'c') {
                        process.exit();
                    }
                    else {
                        // clearTimeout(start);
                        status = 1;
                        resolve({ start: 1, conf: conf });
                    }
                });
                let i = 10;
                while (i != 0 && status == 0) {
                    process.stdout.write(`Start in ${i} sec. Press any key to cancell   \r`);
                    // console.log(`Start in ${i} sec. Press any key to cancell`);
                    yield delay(1000);
                    i--;
                    // console.clear();
                }
                if (status == 0) {
                    process.stdin.setRawMode(false);
                    process.stdin.destroy();
                    ;
                    resolve({ start: 0, conf: conf });
                }
            }));
        }
        else if (configCheck == 'Конфигурация не найдена') {
            let conf = yield startCLI();
            return { start: 3, conf: conf };
        }
    });
}
exports.startOnGoodConfig = startOnGoodConfig;
