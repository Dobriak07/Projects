import { Prompt } from "./core/prompt/prompt.service";
import { checkIP, checkPort } from './helpers/promt.check'
import path from "path";

const START_OPTIONS  = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
}

async function main() {
    const prompt = new Prompt();
    let { answer } = await prompt.input([
        {
            type: 'list',
            name: 'answer',
            message: 'Выберите действие',
            choices: [START_OPTIONS.setup, START_OPTIONS.execute]
        }
    ]);
    if(answer === START_OPTIONS.setup) {
        let input = await prompt.input([
            {
                type: 'input',
                name: 'ip',
                message: 'Введите IP-адрес сервера FaceX',
                default: '127.0.0.1',
                validate: checkIP
            },
            {
                type: 'input',
                name: 'port',
                message: 'Введите порт сервера FaceX',
                default: '21093',
                validate: checkPort
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
}

main();

