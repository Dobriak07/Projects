import log4js, { Configuration } from 'log4js';

export class LoggerService {
    logger: log4js.Logger;
    loggerConsole: log4js.Logger;
    constructor(config: Configuration) {
        log4js.configure(config);
        this.logger = log4js.getLogger('file');
        this.loggerConsole = log4js.getLogger('console');
    }

    info(msg: string, ...args: any[]) {
        this.logger.info(msg, ...args);
        this.loggerConsole.info(msg, ...args);
    }

    error(msg: string, ...args: any[]) {
        this.logger.error(msg, ...args);
        this.loggerConsole.error(msg, ...args);
    }

    debug(msg: string, ...args: any[]) {
        this.logger.debug(msg, ...args);
        this.loggerConsole.debug(msg, ...args);
    }

    trace(msg: string, ...args: any[]) {
        this.logger.trace(msg, ...args);
        this.loggerConsole.trace(msg, ...args);
    }
}