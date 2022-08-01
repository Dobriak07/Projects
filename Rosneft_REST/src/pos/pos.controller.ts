import 'reflect-metadata';
import { NextFunction, Request, Response } from 'express';
import { BaseController } from '../common/base.controller';
import { ILogger } from '../logger/logger.inteface';
import { inject } from 'inversify';
import { TYPES } from '../types';
import { PosControllerDto } from './dto/pos.controller.dto';
import { ValidateMiddleware } from '../common/validate.middleware';
import { ConfigService } from '../config/config.service';
import { HttpError } from '../errors/http-error.class';
import { IPosController } from './pos.controller.interface';
import { RestSos } from './pos-to-sos.service';

export class PosController extends BaseController implements IPosController {
	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.ConfigService) private config: ConfigService,
		@inject(TYPES.PosToSosService) private sos: RestSos,
	) {
		super(logger);
		this.bindRoutes([
			{
				path: '/PosEvent',
				method: 'post',
				func: this.sendRestSecuros,
				middlewares: [new ValidateMiddleware(PosControllerDto)],
			},
		]);
		config.init();
	}

	sendRestSecuros(req: Request<{}, {}, PosControllerDto>, res: Response, next: NextFunction): void {
		this.logger.info(`Получены данные: ${JSON.stringify(req.body)}`);
		this.sos.send(req.body);
		this.ok(res, { success: `Recieved params`, data: req.body });
	}
}
