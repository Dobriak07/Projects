import { checkConfig, readConfig, saveConfig } from "./helpers/config.handler";
import { Prompt } from "./core/prompt/prompt.service";
import { checkIP, checkPath, checkPort } from './helpers/promt.check'
import { scanDir } from "./helpers/fs.scan";
import { printMessage } from "./core/console/console.log.service";
import { exifReader } from './core/exif/exif.service';
import { Conf } from './core/types/myTypes';
import { DirScan } from "./core/types/myTypes";

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
        if (conf == 'bad') {
            console.log('Ошибка загрузки из конфигурационного файла');
            startCLI();
        }
        main(conf);
    } 
}

async function main(conf: Conf, dirPath?: string) {
    try {
        let res: DirScan | undefined = dirPath ? await scanDir(conf, dirPath) : await scanDir(conf);
        if (res?.files.length != 0 && res?.files) {
            for (let file of res?.files) {
                printMessage(`File found: ${file}`);
                let { exifInfo, imageBuf } = await exifReader(file);
                printMessage(JSON.stringify(exifInfo));
                console.log(imageBuf);
            }
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