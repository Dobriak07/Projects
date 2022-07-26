import 'reflect-metadata';
import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.inteface';
import { inject } from 'inversify';
import { TYPES } from '../types';
import { TabloControllerDto } from './dto/tablo.controller.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { ITablo } from './tablo.service.interface';
import { ConfigService } from '../config/config.service';
import { TabloOld } from './tablo.builder/tablo.old';
import { TabloNew } from './tablo.builder/tablo.new';
import { HttpError } from '../errors/http-error.class';

export class TabloController extends BaseController {
	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.TabloService) private tablo: ITablo,
		@inject(TYPES.ConfigService) private config: ConfigService,
		@inject(TYPES.TabloOld) private tabloOld: TabloOld,
		@inject(TYPES.TabloNew) private tabloNew: TabloNew,
	) {
		super(logger);
		this.bindRoutes([
			{ path: '/tablo1', method: 'get', func: this.checkTablo1 },
			{ path: '/tablo2', method: 'get', func: this.checkTablo2 },
			{
				path: '/tablo1',
				method: 'post',
				func: this.sendTablo1,
				middlewares: [new ValidateMiddleware(TabloControllerDto)],
			},
			{
				path: '/tablo2',
				method: 'post',
				func: this.sendTablo2,
				middlewares: [new ValidateMiddleware(TabloControllerDto)],
			},
		]);
		config.init();
	}

	checkTablo1(req: Request, res: Response, next: NextFunction): void {
		this.tablo
			.check(Number(this.config.get('MOXA_PORT_1')), this.config.get('MOXA_IP'))
			.then((result) => {
				if (result) this.ok(res, { status: 'Табло 1 онлайн' });
			})
			.catch(() => {
				next(new HttpError('Табло 1 оффлайн', 422, 'GET TABLO1'));
			});
	}

	checkTablo2(req: Request, res: Response, next: NextFunction): void {
		this.tablo
			.check(Number(this.config.get('MOXA_PORT_2')), this.config.get('MOXA_IP'))
			.then((result) => {
				if (result) this.ok(res, { status: 'Табло 2 онлайн' });
			})
			.catch(() => {
				next(new HttpError('Табло 2 оффлайн', 422, 'GET TABLO2'));
			});
	}

	sendTablo1(req: Request<{}, {}, TabloControllerDto>, res: Response, next: NextFunction): void {
		this.logger.debug(`Получена строка: ${req.body.msg}`);
		const buf = this.tabloOld.tabloBuild(req.body.msg);
		this.tablo
			.send(buf, Number(this.config.get('MOXA_PORT_1')), this.config.get('MOXA_IP'))
			.then((result) => {
				if (result) {
					this.ok(res, { status: 'Табло 1 успешная отправка' });
				}
			})
			.catch(() => {
				next(new HttpError('Табло 1 оффлайн', 422, 'GET TABLO1'));
			});
	}

	sendTablo2(req: Request<{}, {}, TabloControllerDto>, res: Response, next: NextFunction): void {
		this.logger.debug(`Получена строка: ${req.body.msg}`);
		const buf = this.tabloNew.tabloBuild(req.body.msg);
		this.tablo
			.send(buf, Number(this.config.get('MOXA_PORT_2')), this.config.get('MOXA_IP'))
			.then((result) => {
				if (result) {
					this.ok(res, { status: 'Табло 2 успешная отправка' });
				}
			})
			.catch(() => {
				next(new HttpError('Табло 2 оффлайн', 422, 'GET TABLO2'));
			});
	}
}
