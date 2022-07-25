export interface IConfigService {
	init: () => void;
	get: (key: string) => string;
}
