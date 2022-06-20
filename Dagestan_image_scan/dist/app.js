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
const prompt_service_1 = require("./core/prompt/prompt.service");
const promt_check_1 = require("./helpers/promt.check");
const START_OPTIONS = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const prompt = new prompt_service_1.Prompt();
        let { answer } = yield prompt.input([
            {
                type: 'list',
                name: 'answer',
                message: 'Выберите действие',
                choices: [START_OPTIONS.setup, START_OPTIONS.execute]
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
                    type: 'input',
                    name: 'port',
                    message: 'Введите порт сервера FaceX',
                    default: '21093',
                    validate: promt_check_1.checkPort
                },
                {
                    type: 'file-tree-selection',
                    enableGoUpperDirectory: true,
                    onlyShowDir: true,
                    name: 'scanDir',
                    message: 'Выберите папку для сканирования',
                    // root: path.resolve("../"),
                    pageSize: 50,
                    hideRoot: false,
                },
            ]);
            console.log(input);
        }
    });
}
main();
