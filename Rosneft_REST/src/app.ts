import 'reflect-metadata';
import express, { Express } from 'express';
import { Server } from 'http';
import { ILogger } from './logger/logger.inteface';
import { json } from 'body-parser';
import { ExeptionFilter } from './errors/exeption.filter';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { ConfigService } from './config/config.service';
import { PosController } from './pos/pos.controller';

@injectable()
export class App {
	app: Express;
	port: number;
	server!: Server;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.PosController) private posController: PosController,
		@inject(TYPES.ExeptionFilter) private exeptionFilter: ExeptionFilter,
		@inject(TYPES.ConfigService) private ConfigService: ConfigService,
	) {
		ConfigService.init();
		this.app = express();
		this.port = Number(ConfigService.get('SERVER_PORT'));
	}

	useRoutes(): void {
		this.app.use(json());
		this.app.use(this.posController.router);
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
