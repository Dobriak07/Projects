import 'reflect-metadata';
import log4js from 'log4js';
import { ILogger } from './logger.inteface';
import { injectable } from 'inversify';
import { FileService } from '../file/file.service';
import { IConfigService } from '../config/config.service.interface';

export const DEFAULT_LOG_SETTINGS = {
	appenders: {
		console: {
			type: 'stdout',
			layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} %[[%-5p]%] %m' },
		},
		app: {
			type: 'file',
			filename: './logs/tablo.log',
			maxLogSize: '10M',
			backups: 5,
			layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' },
		},
	},
	categories: {
		default: { appenders: ['console', 'app'], level: 'info' },
	},
};

@injectable()
export class LoggerService implements ILogger {
	public logger: log4js.Logger;

	constructor() {
		// this.configure();
		this.logger = log4js.getLogger('default');
	}

	configure(config: IConfigService): void {
		const fileService = new FileService();
		log4js.configure(DEFAULT_LOG_SETTINGS);
		config.init();
		const LOG_CONFIG_PATH = config.get('LOG_CONFIG_PATH');
		// console.log(LOG_CONFIG_PATH);
		if (!fileService.isExist(LOG_CONFIG_PATH)) {
			fileService.writeFile(LOG_CONFIG_PATH, JSON.stringify(DEFAULT_LOG_SETTINGS, null, 3));
		}
		log4js.configure(LOG_CONFIG_PATH);
	}

	info(...args: unknown[]): void {
		this.logger.info('', ...args);
	}

	error(...args: unknown[]): void {
		this.logger.error('', ...args);
	}

	debug(...args: unknown[]): void {
		this.logger.debug('', ...args);
	}
}
