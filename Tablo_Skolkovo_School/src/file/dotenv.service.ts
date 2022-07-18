import dotenv from 'dotenv';

export class DotEnvLoader {
	public static getEnv(ENV: string): string {
		const result = dotenv.config();
		if (result.error) {
			return './app.logger.json';
		}
		const value = process.env[ENV];
		if (value) {
			return value;
		} else {
			return './app.logger.json';
		}
	}
}
