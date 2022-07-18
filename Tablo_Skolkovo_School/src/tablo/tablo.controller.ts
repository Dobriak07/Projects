import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.inteface';
import 'reflect-metadata';
import { inject } from 'inversify';
import { TYPES } from '../types';

export class TabloController extends BaseController {
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		super(logger);
		this.bindRoutes([
			{ path: '/tablo1', method: 'get', func: this.checkTablo1 },
			{ path: '/tablo2', method: 'get', func: this.checkTablo2 },
			{ path: '/tablo1', method: 'post', func: this.sendTablo1 },
			{ path: '/tablo2', method: 'post', func: this.sendTablo1 },
		]);
	}

	checkTablo1(req: Request, res: Response, next: NextFunction): void {
		this.ok(res, 'Tablo 1 ok');
	}

	checkTablo2(req: Request, res: Response, next: NextFunction): void {
		this.ok(res, 'Tablo 2 ok');
	}

	sendTablo1(req: Request, res: Response, next: NextFunction): void {
		this.ok(res, 'Tablo 1 message sent');
	}

	sendTablo2(req: Request, res: Response, next: NextFunction): void {
		this.ok(res, 'Tablo 2 message sent');
	}
}
