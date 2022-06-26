import path from "path";
import fs from 'fs';

export function checkIP(ip: string) {
    if (ip.split('.').length !== 4) {
        return 'Введен некорректный IP-адрес, IP-адрес должен быть вида *.*.*.*'
    } else {
        return true;
    }
}

export function checkPort(port: number) {
    if(port === 0 || port === undefined) {
        return 'Введен некорректный порт';
    } else {
        return true
    }
}

export function checkPath(dirPath: string) {
    let dir = path.resolve(dirPath);
    try {
        let stat = fs.statSync(dir).isDirectory();
        if (stat) {
            return true
        }
        return 'Указанный путь неверен. Возможно указан файл?'
    } catch(e) {
        if (e) return 'Укажите корректный путь'
    }
}