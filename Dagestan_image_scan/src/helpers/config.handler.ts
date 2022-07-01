import fs from 'fs';
import path from 'path';
import { Conf } from '../core/types/myTypes';

const CONFIG_PATH: string = './config';
const CONFIG_FILE: string = 'config.json';

export async function checkConfig() {
    try {
        await fs.promises.stat(path.join(CONFIG_PATH, CONFIG_FILE));
        return 'Конфигурация найдена';
    }
    catch (err) {
        if (err) return('Конфигурация не найдена');
    }
}

export async function saveConfig(conf: Object) {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            await fs.promises.mkdir(CONFIG_PATH);
        }
        await fs.promises.writeFile(path.join(CONFIG_PATH, CONFIG_FILE), JSON.stringify(conf, null, 4));
        return 'Конфигурация сохранена';
    }
    catch (err) {
        if (err) throw new Error('Ошибка сохранения конфигурации');
    }
}

export async function readConfig(): Promise<string | Conf> {
    try {
        let file = (await fs.promises.readFile(path.join(CONFIG_PATH, CONFIG_FILE))).toString();
        let config: Conf = JSON.parse(file);
        return config;
    }
    catch (err) {
        if (err) return 'bad';
        return 'bad';
    }
}