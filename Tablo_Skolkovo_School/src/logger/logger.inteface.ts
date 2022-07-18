export interface ILogger {
	logger: unknown;
	info: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
	debug: (...args: unknown[]) => void;
}
