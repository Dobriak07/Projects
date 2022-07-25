import { ConfigService } from '../config/config.service';

export interface ILogger {
	logger: unknown;
	configure: (config: ConfigService) => void;
	info: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
	debug: (...args: unknown[]) => void;
}
