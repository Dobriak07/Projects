const securos = require('securos');
const ViParser = require('viparser'); // Парсер данных от VideoIntellect
const WebSocket = require('ws');
const log4js = require('log4js');
let socketStatus = null;
const deltaTime = 0; // Время задержки сети. При обнаружении несоответствия рамки в архиве можно изменить
const reconnectInterval = 5000; // Таймаут переподключения к VideoIntellect в мс
const connOptions = {
    host: '172.16.14.222', // IP-адрес сервера процессинга VideoIntellect
    port: 9004, // Порт сервера процессинга VideoIntellect
    protocols: ['websocket'], // Протокол подключения. VideoIntellect использует жестко вебсокеты
    authKey: `${Buffer.from('VideoIntellect:Vi-events_wss_subscr_pass').toString('base64')}` // Ключ аутентификации
};
const VI_LOGS_PATH = '/var/opt/securos/logs/VI'; // Расположение логов скрипта
const delay = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));
const mkId = '1'; // Идентификатор МК для отрисовки захватов на живом видео
const draw_interval = 5000; // Интервал обновления отрисованных фигур в мс

log4js.configure({
    appenders: { 
        vi_integration: { type: "file", filename: `${VI_LOGS_PATH}/VI_integration.log`, maxLogSize: 100000, backups: 5, mode: 0o777, layout: { type: 'basic' } }, // maxLogSize в байтах, backups - количество бэкапов карусели логов, mode - права на файлы (Linux)
    },
    categories: { 
        default: { appenders: ["vi_integration"], level: "debug" } // level - уровень логирования, trace - если нужно видел объекты получаемые от VideoIntellect и передаваемые в SecurOS
    }
});

const logger = log4js.getLogger();

securos.connect(async (core) => {
    function socketConnect() {
        const client = new WebSocket(`ws://${connOptions.host}:${connOptions.port}/`, {
            protocols: connOptions.protocols,
            perMessageDeflate: false,
            headers: {
                "Authorization" : `Basic ${connOptions.authKey}`
            }
        });
        return new Promise((resolve, reject) => {
            client.on('error', (err) => {
                socketStatus = false;
                reject(err);
            }) 
        
            client.on('open', () => {
                console.log(`Succesfully connected to ws://${connOptions.host}:${connOptions.port}/`);
                logger.info(`Succesfully connected to ws://${connOptions.host}:${connOptions.port}/`);
                socketStatus = true;
                resolve(socketStatus);
            })

            client.on('close', (err) => {
                socketStatus = false;
                reject(err);
            })
        
            client.on('message', async (msg) => {
                let state = '';
                let messageData = JSON.parse(msg.toString());
                let data = new ViParser(messageData, deltaTime);
                securosProtocol(data);
                // securosLive(data);
                let handler = core.registerEventHandler('MEDIA_CLIENT', mkId, 'STATE', (e) => {
                    state = JSON.parse(e.params.state);
                    for (cam of state.videoLayout) {
                        console.log(cam);
                        if (data.cameraId == cam.camId && cam.live == 1) {
                            securosLive(data);
                            console.log('Drawing shapes');
                            break;
                        }
                    }
                    handler.unregister();
                });
                core.doReact('MEDIA_CLIENT', mkId, 'GET_STATE');
            })
        })
    }

    async function reconnect() {
        try {
            await socketConnect();
        }
        catch (err) {
            console.log(`Socket connection ERROR:`, new Error(err.message));
            logger.error(`Socket connection ERROR:`, new Error(err.message));
        }
    }    

    reconnect();

    setInterval( () => { if (!socketStatus) reconnect() }, reconnectInterval );

    function securosProtocol(data) {
        // console.log(data);
        logger.trace(`Data from VI:`, data);

        let commentToSecuros = {
            comment: data.comment,
            description: 'Событие VCA',
            visualization: data.visualization
        }
        
        let date = `${data.eventTime.slice(8,10)}-${data.eventTime.slice(5,7)}-${data.eventTime.slice(2,4)}`;
        let time = `${data.eventTime.split('T')[1]}`;

        let params = {
            comment: JSON.stringify(commentToSecuros),
            date: date,
            time: time
        }
        logger.trace(`Data sending to SecurOS:`, params)
        core.sendEvent('CAM', data.cameraId, 'VCA_EVENT', params);
    }

    async function securosLive(data) {
        let timeIn = Date.now();
        let params = {
            cam: data.cameraId,
            shapes: data.visualization
        }
        
        let paramsClear = {
            cam: data.cameraId,
            shapes: ''
        }

        while (Date.now() <= timeIn + draw_interval) {
            core.doReact('MEDIA_CLIENT', mkId, 'DRAW_SHAPES_ON_FRAME', params);
            await delay(500);
            core.doReact('MEDIA_CLIENT', mkId, 'DRAW_SHAPES_ON_FRAME', paramsClear);
            await delay(500);
        }
    }
})