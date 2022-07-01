"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const log4js_1 = __importDefault(require("log4js"));
class LoggerService {
    constructor(config) {
        log4js_1.default.configure(config);
        this.logger = log4js_1.default.getLogger('file');
        this.loggerConsole = log4js_1.default.getLogger('console');
    }
    info(msg, ...args) {
        this.logger.info(msg, ...args);
        this.loggerConsole.info(msg, ...args);
    }
    error(msg, ...args) {
        this.logger.error(msg, ...args);
        this.loggerConsole.error(msg, ...args);
    }
    debug(msg, ...args) {
        this.logger.debug(msg, ...args);
        this.loggerConsole.debug(msg, ...args);
    }
    trace(msg, ...args) {
        this.logger.trace(msg, ...args);
        this.loggerConsole.trace(msg, ...args);
    }
}
exports.LoggerService = LoggerService;
