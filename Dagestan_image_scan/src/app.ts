import { Prompt } from "./core/prompt/prompt.service";
import { checkIP, checkPath, checkPort } from './helpers/promt.check'

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
                type: 'input',
                name: 'path',
                message: 'Укажите путь до папки для сканирования',
                validate: checkPath
            },
        ]);
        console.log(input);
    }   
}

main();

