import fs from 'fs';
import path from 'path';
import { Log_Config } from '../core/types/myTypes';

const CONFIG_PATH: string = './config';
const CONFIG_FILE: string = 'log_config.json';
const DEFAULT_CONFIG: Log_Config = {
    appenders: {
        console: { type: 'console', layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} %[[%-5p]%] %m' } },
        file: { type: 'file', filename: './logs/app_scan.log', maxLogSize: '10M', backups: 5, layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' }}
    },
    categories: {
        default: { appenders: ['console'], level: 'off' },
        console: { appenders: ['console'], level: 'info' },
        file: { appenders: ['file'], level: 'info' }
    }
} 

export async function logConfig() {
    try {
        await fs.promises.stat(path.join(CONFIG_PATH, CONFIG_FILE));
        let file = (await fs.promises.readFile(path.join(CONFIG_PATH, CONFIG_FILE))).toString();
        let config: Log_Config = JSON.parse(file);
        return config;
    }
    catch (err) {
        await fs.promises.writeFile(path.join(CONFIG_PATH, CONFIG_FILE), JSON.stringify(DEFAULT_CONFIG, null, 4));
        if (err) console.log('Конфигурация логгера не найдена');
        return DEFAULT_CONFIG;
    }
}