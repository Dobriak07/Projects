import { IConfigService } from './config.service.interface';
import { config, DotenvConfigOutput, DotenvParseOutput } from 'dotenv';
import { inject, injectable, LazyServiceIdentifer } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.inteface';

@injectable()
export class ConfigService implements IConfigService {
	private config: DotenvParseOutput;

	constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

	init(): void {
		const result: DotenvConfigOutput = config();
		if (result.error) {
			this.logger.error('Не удалось прочитать .env или он отсутсвует');
		} else {
			this.logger.info('Конфигурация загружена из .env');
			this.config = result.parsed as DotenvParseOutput;
		}
	}

	get(key: string): string {
		return this.config[key];
	}
}
