import { NextFunction, Request, Response } from 'express';

export interface IPosController {
	sendRestSecuros: (req: Request, res: Response, next: NextFunction) => void;
}
