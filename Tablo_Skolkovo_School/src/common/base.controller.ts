import 'reflect-metadata';
import { ILogger } from '../logger/logger.inteface';
import { Response, Router } from 'express';
import { ExpressReturnType, IControllerRoute } from './route.interface';
import { injectable } from 'inversify';

@injectable()
export abstract class BaseController {
	private readonly _router: Router;

	constructor(private loggerBase: ILogger) {
		this._router = Router();
	}

	// return Router for express.use
	get router(): Router {
		return this._router;
	}

	// method send custom response+code
	public send<T>(res: Response, code: number, msg: T): ExpressReturnType {
		res.type('application/json');
		return res.status(code).json(msg);
	}

	// method send response with code 200
	public ok<T>(res: Response, msg: T): ExpressReturnType {
		return this.send<T>(res, 200, msg);
	}

	// Rotes binding to Router
	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			this.loggerBase.debug(`Bind route: [${route.method}] ${route.path}`);
			const middleware = route.middlewares?.map((m) => m.execute.bind(m));
			const handler = route.func.bind(this);
			const pipeline = middleware ? [...middleware, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}
