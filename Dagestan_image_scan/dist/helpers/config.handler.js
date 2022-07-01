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
exports.readConfig = exports.saveConfig = exports.checkConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CONFIG_PATH = './config';
const CONFIG_FILE = 'config.json';
function checkConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.default.promises.stat(path_1.default.join(CONFIG_PATH, CONFIG_FILE));
            return 'Конфигурация найдена';
        }
        catch (err) {
            if (err)
                return ('Конфигурация не найдена');
        }
    });
}
exports.checkConfig = checkConfig;
function saveConfig(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!fs_1.default.existsSync(CONFIG_PATH)) {
                yield fs_1.default.promises.mkdir(CONFIG_PATH);
            }
            yield fs_1.default.promises.writeFile(path_1.default.join(CONFIG_PATH, CONFIG_FILE), JSON.stringify(conf, null, 4));
            return 'Конфигурация сохранена';
        }
        catch (err) {
            if (err)
                throw new Error('Ошибка сохранения конфигурации');
        }
    });
}
exports.saveConfig = saveConfig;
function readConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let file = (yield fs_1.default.promises.readFile(path_1.default.join(CONFIG_PATH, CONFIG_FILE))).toString();
            let config = JSON.parse(file);
            return config;
        }
        catch (err) {
            if (err)
                return 'bad';
            return 'bad';
        }
    });
}
exports.readConfig = readConfig;
