"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPort = exports.checkIP = void 0;
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
