"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPath = exports.checkPort = exports.checkIP = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function checkIP(ip) {
    if (ip.split('.').length !== 4) {
        return 'Введен некорректный IP-адрес, IP-адрес должен быть вида *.*.*.*';
    }
    else {
        return true;
    }
}
exports.checkIP = checkIP;
function checkPort(port) {
    if (port === 0 || port === undefined) {
        return 'Введен некорректный порт';
    }
    else {
        return true;
    }
}
exports.checkPort = checkPort;
function checkPath(dirPath) {
    let dir = path_1.default.normalize(dirPath);
    try {
        let stat = fs_1.default.statSync(dir).isDirectory();
        if (stat) {
            return true;
        }
        return 'Указанный путь неверен. Возможно указан файл?';
    }
    catch (e) {
        if (e)
            return 'Укажите корректный путь';
    }
}
exports.checkPath = checkPath;
