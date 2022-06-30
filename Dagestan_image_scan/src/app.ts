import { checkConfig, readConfig, saveConfig } from "./helpers/config.handler";
import { Prompt } from "./core/prompt/prompt.service";
import { checkIP, checkPath, checkPort, checkFaceListName } from './helpers/promt.check'
import { scanDir } from "./helpers/fs.scan";
import { printMessage } from "./core/console/console.log.service";
import { Conf } from './core/types/myTypes';
import { DirScan } from "./core/types/myTypes";
import { uploadSession } from "./core/facex/facexapi";
import { pg } from "./core/db/pg.service";

const START_OPTIONS  = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
};

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
                type: 'number',
                name: 'port',
                message: 'Введите порт сервера FaceX',
                default: '21093',
                validate: checkPort
            },
            {
                type: 'input',
                name: 'list_name',
                message: 'Введите имя Контрольного списка FaceX',
                default: 'Image_scan',
                validate: checkFaceListName
            },
            {
                type: 'input',
                name: 'pg_ip',
                message: 'Введите IP-адрес PostgreSQL',
                default: '127.0.0.1',
                validate: checkIP
            },
            {
                type: 'number',
                name: 'pg_port',
                message: 'Введите порт PostgreSQL',
                default: '5432',
                validate: checkPort
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
                validate: checkPath
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
        await saveConfig(input);
        startCLI();
    } else {
        let conf = await readConfig();
        if (conf == 'bad' || typeof conf == 'string') {
            console.log('Ошибка загрузки из конфигурационного файла');
            startCLI();
        }
        else if (!conf) {
            console.log('No config');
        }
        else {
            let pgRes = await pg(conf);
            console.log(pgRes);
        }
        // main(conf);
    } 
}

async function main(conf: Conf, dirPath?: string) {
    try {
        let res: DirScan | undefined = dirPath ? await scanDir(conf, dirPath) : await scanDir(conf);
        if (res?.files.length != 0 && res?.files) {
            await uploadSession(conf, res.files);
        }
        if (res?.dirs.length != 0 && res?.dirs) {
            for (let dir of res.dirs) {
                printMessage(`Switching to ${dir}`);
                await main(conf, dir);
            }
        }
    }
    catch (err) {
        if (err) console.log(err);
    }
}