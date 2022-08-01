import 'reflect-metadata';
import qs from 'qs';
import axios, { Axios, AxiosError, AxiosResponse } from 'axios';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ConfigService } from '../config/config.service';

@injectable()
export class SosRest {
	private _axios: Axios;
	private restIP: string;
	private restPort: number;

	constructor(@inject(TYPES.ConfigService) private ConfigService: ConfigService) {
		this.ConfigService.init();
		this.restIP = this.ConfigService.get('REST_IP');
		this.restPort = Number(this.ConfigService.get('REST_PORT'));
		this._axios = axios.create({
			baseURL: `http://${this.restIP}:${this.restPort}/api/v1/events`,
			headers: { 'content-type': 'application/json' },
			auth: {
				username: this.ConfigService.get('REST_USERNAME'),
				password: this.ConfigService.get('REST_PASSWORD'),
			},
		});
	}

	send(data: Object): void {
		this._axios
			.post('/send_event', data)
			.then((res: AxiosResponse) => {
				console.log(res.status);
				console.log(res.statusText);
			})
			.catch((error: AxiosError) => {
				if (error) {
					console.log(error.code);
					console.log(error.message);
					console.log(error.status);
				}
			});
	}
}
