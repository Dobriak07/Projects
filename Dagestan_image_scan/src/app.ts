import { checkConfig, readConfig, saveConfig } from "./helpers/config.handler";
import { Prompt } from "./core/prompt/prompt.service";
import { checkIP, checkPath, checkPort } from './helpers/promt.check'
import { DirScan, scanDir } from "./helpers/fs.scan";
import { printMessage } from "./core/console/console.log.service";

const START_OPTIONS  = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
};

type Conf = {
    ip: string,
    port: string | number,
    path: string
}
const prompt = new Prompt();

startCLI();

async function startCLI() {
    await checkConfig();
    let { answer } = await prompt.input([
        {
            type: 'list',
            name: 'answer',
            message: 'Выберите действие',
            choices: [START_OPTIONS.execute, START_OPTIONS.setup]
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
        await saveConfig(input);
        startCLI();
    } else {
        let conf = await readConfig();
        if (conf == 'bad') {
            console.log('Ошибка загрузки из конфигурационного файла');
            startCLI();
        }
        main(conf)
    } 
}

async function main(conf: Conf) {
    try {
        let res: DirScan | undefined = await scanDir(conf.path);
        if (res?.files.length != 0 && res?.files) {
            for (let file of res?.files) {
                printMessage(`File found: ${file}`);
            }
        }
        if (res?.dirs.length != 0 && res?.dirs) {
            for (let dir of res.dirs) {
                printMessage(`Switching to ${dir}`);
                let _dir = { path: dir};
                await main(_dir as unknown as Conf);
            }
        }
    }
    catch (err) {
        if (err) console.log(err);
    }
}

