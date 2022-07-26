import 'reflect-metadata';
import express, { Express } from 'express';
import { Server } from 'http';
import { ILogger } from './logger/logger.inteface';
import { json } from 'body-parser';
import { TabloController } from './tablo/tablo.controller';
import { ExeptionFilter } from './errors/exeption.filter';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { ConfigService } from './config/config.service';

@injectable()
export class App {
	app: Express;
	port: number;
	server!: Server;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.TabloController) private tabloController: TabloController,
		@inject(TYPES.ExeptionFilter) private exeptionFilter: ExeptionFilter,
		@inject(TYPES.ConfigService) private ConfigService: ConfigService,
	) {
		ConfigService.init();
		this.app = express();
		this.port = Number(ConfigService.get('SERVER_PORT'));
	}

	useRoutes(): void {
		this.app.use(json());
		// this.app.use((req, res, next) => {
		// 	this.logger.debug(`Time ${Date.now()}`);
		// 	this.logger.debug(`Request`, req.originalUrl);
		// 	this.logger.debug('Body', req.body);
		// 	this.logger.debug(`Response`, res.statusCode);
		// 	next();
		// });
		this.app.use('/v1', this.tabloController.router);
	}

	useExeptionFilters(): void {
		this.app.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
	}

	public async init(): Promise<void> {
		this.logger.configure(this.ConfigService);
		this.useRoutes();
		this.useExeptionFilters();
		this.server = this.app.listen(this.port);
		this.logger.info(`Сервер запущен на http://localhost:${this.port}`);
	}
}
