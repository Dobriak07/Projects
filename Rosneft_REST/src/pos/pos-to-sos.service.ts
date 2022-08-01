import 'reflect-metadata';
import qs from 'qs';
import axios, { Axios } from 'axios';
import { inject, injectable } from 'inversify';
import { ConfigService } from '../config/config.service';
import { IConfigService } from '../config/config.service.interface';
import { TYPES } from '../types';

@injectable()
export class RestSos {
	private axios: Axios;

	constructor(
		@inject(TYPES.ConfigService) private config: IConfigService,
		private restIP: string,
		private restPort: number,
	) {
		config.init();
		this.restIP = config.get('REST_IP');
		this.restPort = Number(config.get('REST_PORT'));
		this.axios = axios.create({
			baseURL: `http://${this.restIP}:${this.restPort}/api/v1/events`,
			auth: {
				username: config.get('REST_USERNAME'),
				password: config.get('REST_PASSWORD'),
			},
		});
	}

	send(data: Object): void {
		this.axios.post('/send_event', qs.stringify(data)).catch((error) => {
			if (error) console.log(error);
		});
	}
}
