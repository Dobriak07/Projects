import { NextFunction, Request, Response } from "express";

export interface ITabloController {
    checkTablo1: (req: Request, res: Response, next: NextFunction) => void;
    checkTablo2: (req: Request, res: Response, next: NextFunction) => void;
    sendTablo1: (req: Request, res: Response, next: NextFunction) => void;
    sendTablo2: (req: Request, res: Response, next: NextFunction) => void;
}