import 'reflect-metadata';
import { ITablo, TabloState } from './tablo.service.interface';
import net, { Socket } from 'net';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.inteface';

@injectable()
export class Tablo implements ITablo {
	private tablo: Socket;
	constructor(@inject(TYPES.ILogger) private logger: ILogger) {}

	check(port: number, host: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.tablo = net.connect({
				port: port,
				host: host,
			});

			this.tablo.on('connect', () => {
				this.logger.info(`Успешное подключение к моксе ${host}:${port}`);
				resolve(true);
			});

			this.tablo.on('error', async (err) => {
				if (err instanceof Error) {
					this.logger.error(`Ошибка подключения к порту моксы ${err.message}`);
				}
				this.tablo.end();
				this.tablo.removeAllListeners();
				reject(false);
			});
		});
	}

	send(msg: Buffer, port: number, host: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.tablo = net.connect({
				port: port,
				host: host,
			});

			this.tablo.on('connect', () => {
				this.logger.info(`Успешное подключение к моксе ${host}:${port}`);
				this.tablo.write(msg, (err) => {
					if (err && err instanceof Error) {
						this.logger.error(`Error sending to Moxa ${err.message}`);
						reject(false);
					} else {
						this.tablo.removeAllListeners();
						this.tablo.end();
						resolve(true);
					}
				});
			});

			this.tablo.on('error', async (err) => {
				if (err instanceof Error) {
					this.logger.error(`Ошибка подключения к порту моксы ${err.message}`);
				}
				this.tablo.end();
				this.tablo.removeAllListeners();
				reject(false);
			});
		});
	}
}
