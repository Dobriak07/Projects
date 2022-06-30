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
exports.startCLI = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const config_handler_1 = require("../../helpers/config.handler");
const promt_options_1 = require("./promt.options");
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
            console.log('prompt');
            const prompt = new Prompt();
            yield (0, config_handler_1.checkConfig)();
            let { answer } = yield prompt.input(promt_options_1.promptStart);
            if (answer === promt_options_1.START_OPTIONS.setup) {
                let input = yield prompt.input(promt_options_1.promptQuestions);
                console.log(input);
                yield (0, config_handler_1.saveConfig)(input);
                return (startCLI());
            }
            else {
                let conf = yield (0, config_handler_1.readConfig)();
                if (conf == 'bad' || typeof conf == 'string') {
                    console.log('Ошибка загрузки из конфигурационного файла');
                    return (startCLI());
                }
                else if (!conf) {
                    console.log('No config');
                }
                else {
                    let conf = yield (0, config_handler_1.readConfig)();
                    return (conf);
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    });
}
exports.startCLI = startCLI;
