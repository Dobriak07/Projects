import fs from 'fs';
import path from 'path';

const CONFIG_PATH: string = './config';
const CONFIG_FILE: string = 'config.json';

export async function checkConfig() {
    try {
        await fs.promises.stat(path.join(CONFIG_PATH, CONFIG_FILE));
        return console.log('Конфигурация найдена');
    }
    catch (err) {
        if (err) return console.log('Конфигурация не найдена');
    }
}

export async function saveConfig(conf: Object) {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            await fs.promises.mkdir(CONFIG_PATH);
        }
        await fs.promises.writeFile(path.join(CONFIG_PATH, CONFIG_FILE), JSON.stringify(conf));
        return console.log('Конфигурация сохранена');
    }
    catch (err) {
        if (err) return console.log('Ошибка сохранения конфигурации');
    }
}

export async function readConfig() {
    try {
        let file = (await fs.promises.readFile(path.join(CONFIG_PATH, CONFIG_FILE))).toString();
        let config = JSON.parse(file);
        return config;
    }
    catch (err) {
        if (err) return 'bad';
    }
}