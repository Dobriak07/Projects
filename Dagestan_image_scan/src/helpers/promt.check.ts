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