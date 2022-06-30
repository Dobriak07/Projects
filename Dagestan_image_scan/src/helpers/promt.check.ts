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
    if (typeof port != 'number') {
        return 'Ошибка ввода, введите число';
    }
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

export function checkFaceListName(name: string) {
    if (name.length > 64) {
        return 'Длина списка не должна превышать 64 символа'
    }
    return true;
}