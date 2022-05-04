import { NextFunction, Request, Response } from "express";

export interface IExpertionFilter {
    catch: (err: Error, req: Request, res: Response, next: NextFunction) => void;
}