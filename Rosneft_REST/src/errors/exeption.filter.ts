import 'reflect-metadata';
import { NextFunction, Request, Response } from 'express';
import { ILogger } from '../logger/logger.inteface';
import { IExeptionFilter } from './exeption.filter.interface';
import { HttpError } from './http-error.class';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';

@injectable()
export class ExeptionFilter implements IExeptionFilter {
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		this.logger.info(`Фильтр ошибок создан`);
	}

	catch(err: Error | HttpError, req: Request, res: Response, next: NextFunction): void {
		if (err instanceof HttpError) {
			this.logger.error(`[${err.context}] Ошибка ${err.statusCode}: ${err.message}`);
			res.status(err.statusCode).send({ err: err.message });
		} else {
			this.logger.error(`${err.message}`);
			res.status(500).send({ err: err.message });
		}
	}
}
