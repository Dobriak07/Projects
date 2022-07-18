import log4js from 'log4js';
import { ILogger } from './logger.inteface';
import 'reflect-metadata';
import { injectable } from 'inversify';
import { DotEnvLoader } from '../file/dotenv.service';
import { FileService } from '../file/file.service';

export const DEFAULT_LOG_SETTINGS = {
    appenders: {
      console: { type: "stdout", layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} %[[%-5p]%] %m' } },
      app: { type: "file", filename: "./logs/tablo.log", maxLogSize: '10M', backups: 5, layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } },
    },
    categories: {
      default: { appenders: ["console", "app"], level: "debug" },
    },
}

@injectable()
export class LoggerService implements ILogger {
    public logger: log4js.Logger;

    constructor() {
        this.configure();
        this.logger = log4js.getLogger('default');

    };

    async configure() {
        const fileService = new FileService();
        const LOG_CONFIG_PATH = process.env.LOG_CONFIG_PATH ?? DotEnvLoader.getEnv('LOG_CONFIG_PATH');
        console.log(LOG_CONFIG_PATH);
        if (!(fileService.isExist(LOG_CONFIG_PATH))) {
            fileService.writeFile(LOG_CONFIG_PATH, JSON.stringify(DEFAULT_LOG_SETTINGS, null, 3))
        };
        log4js.configure(LOG_CONFIG_PATH);
    }

    info(...args: unknown[]) {
        this.logger.info('', ...args);
    };

    error(...args: unknown[]) {
        this.logger.error('', ...args);
    };

    debug(...args: unknown[]) {
        this.logger.debug('', ...args);
    };
}