"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptQuestions = exports.promptStart = exports.START_OPTIONS = void 0;
const promt_check_1 = require("./promt.check");
exports.START_OPTIONS = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
};
exports.promptStart = [
    {
        type: 'list',
        name: 'answer',
        message: 'Выберите действие',
        choices: [exports.START_OPTIONS.execute, exports.START_OPTIONS.setup]
    }
];
exports.promptQuestions = [
    {
        type: 'input',
        name: 'ip',
        message: 'Введите IP-адрес сервера FaceX',
        default: '127.0.0.1',
        validate: promt_check_1.checkIP
    },
    {
        type: 'number',
        name: 'port',
        message: 'Введите порт сервера FaceX',
        default: '21093',
        validate: promt_check_1.checkPort
    },
    {
        type: 'input',
        name: 'list_name',
        message: 'Введите имя Контрольного списка FaceX',
        default: 'Image_scan',
        validate: promt_check_1.checkFaceListName
    },
    {
        type: 'input',
        name: 'pg_ip',
        message: 'Введите IP-адрес PostgreSQL',
        default: '127.0.0.1',
        validate: promt_check_1.checkIP
    },
    {
        type: 'number',
        name: 'pg_port',
        message: 'Введите порт PostgreSQL',
        default: '5432',
        validate: promt_check_1.checkPort
    },
    {
        type: 'input',
        name: 'pg_login',
        message: 'Введите логин PostgreSQL',
        default: 'postgres',
    },
    {
        type: 'input',
        name: 'pg_password',
        message: 'Введите пароль PostgreSQL',
        default: 'postgres',
    },
    {
        type: 'input',
        name: 'path',
        message: 'Укажите путь до папки для сканирования',
        validate: promt_check_1.checkPath
    },
    {
        type: 'checkbox',
        name: 'extensions',
        message: 'Выберите расширения файлов для сканирования',
        default: ['.jpg', '.jpeg'],
        choices: ['.jpg', '.jpeg', '.png', '.tiff', '.heic', '.heif']
    }
];
