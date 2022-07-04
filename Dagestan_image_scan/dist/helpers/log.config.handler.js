"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_PATH = './config';
const CONFIG_FILE = 'log_config.json';
const DEFAULT_CONFIG = {
    appenders: {
        console: { type: 'console', layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} %[[%-5p]%] %m' } },
        file: { type: 'file', filename: './logs/app_scan.log', maxLogSize: '10M', backups: 5, layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } }
    },
    categories: {
        default: { appenders: ['console'], level: 'off' },
        console: { appenders: ['console'], level: 'info' },
        file: { appenders: ['file'], level: 'info' }
    }
};
function logConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.default.promises.stat(path_1.default.join(CONFIG_PATH, CONFIG_FILE));
            let file = (yield fs_1.default.promises.readFile(path_1.default.join(CONFIG_PATH, CONFIG_FILE))).toString();
            let config = JSON.parse(file);
            return config;
        }
        catch (err) {
            yield fs_1.default.promises.writeFile(path_1.default.join(CONFIG_PATH, CONFIG_FILE), JSON.stringify(DEFAULT_CONFIG, null, 4));
            if (err)
                console.log('Конфигурация логгера не найдена');
            return DEFAULT_CONFIG;
        }
    });
}
exports.logConfig = logConfig;
