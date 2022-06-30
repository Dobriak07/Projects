import { checkFaceListName, checkIP, checkPath, checkPort } from "./promt.check";
export const START_OPTIONS  = {
    setup: 'Настроить модуль',
    execute: 'Запустить модуль'
};

export const promptStart = [
    {
        type: 'list',
        name: 'answer',
        message: 'Выберите действие',
        choices: [START_OPTIONS.execute, START_OPTIONS.setup]
    }
]

export const promptQuestions = [
    {
        type: 'input',
        name: 'ip',
        message: 'Введите IP-адрес сервера FaceX',
        default: '127.0.0.1',
        validate: checkIP
    },
    {
        type: 'number',
        name: 'port',
        message: 'Введите порт сервера FaceX',
        default: '21093',
        validate: checkPort
    },
    {
        type: 'input',
        name: 'list_name',
        message: 'Введите имя Контрольного списка FaceX',
        default: 'Image_scan',
        validate: checkFaceListName
    },
    {
        type: 'input',
        name: 'pg_ip',
        message: 'Введите IP-адрес PostgreSQL',
        default: '127.0.0.1',
        validate: checkIP
    },
    {
        type: 'number',
        name: 'pg_port',
        message: 'Введите порт PostgreSQL',
        default: '5432',
        validate: checkPort
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
        validate: checkPath
    },
    {
        type: 'checkbox',
        name: 'extensions',
        message: 'Выберите расширения файлов для сканирования',
        default: ['.jpg', '.jpeg'],
        choices: ['.jpg', '.jpeg', '.png', '.tiff', '.heic', '.heif']
    }
];
