import { ILogger } from "../logger/logger.inteface";
import { Response, Router } from "express";
import { IControllerRoute } from "./route.interface";
import 'reflect-metadata';
import { injectable } from "inversify";

@injectable()
export abstract class BaseController {
    private readonly _router: Router;

    constructor(private loggerBase: ILogger) {
        this._router = Router();
    }

    // return Router for express.use
    get router() {
        return this._router;
    }

    // method send custom response+code
    public send<T>(res: Response, code: number, msg: T) {
        res.type('application/json')
        return res.status(code).json(msg);
    }

    // method send response with code 200
    public ok<T>(res: Response, msg: T) {
        return this.send<T>(res, 200, msg);
    }

    // Rotes binding to Router
    protected bindRoutes(routes: IControllerRoute[]) {
        for (const route of routes) {
            this.loggerBase.debug(`Bind route: [${route.method}] ${route.path}`) ;
            const handler = route.func.bind(this);
            this.router[route.method](route.path, handler);
        }
    }
}