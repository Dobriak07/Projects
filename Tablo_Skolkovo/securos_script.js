const { tabloBuild, setupClock } = require('./tablo.js');
const securos = require('securos');
const net = require('net');
const delay = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));
const moxa_IP = '172.16.16.239'; //IP-адрес Моксы 5510
const moxa_port = 4001;//Порт в настройках моксы для связи с ком-портом

const client = net.connect({
    port:moxa_port, 
    host: moxa_IP,
    keepAlive: true
});

client.on('connect', () => {
    console.log('Connected to moxa server');
});

client.on('data', (data) => {
    console.log(typeof(data));
    console.log('Data in:', data.toString('hex'));
    console.log('Data in - no conversion:', data);;
    // client.end()
});

client.on('end', () => {
    console.log('End');
});

client.on('error', async (err) => {
    console.log('Error connection to Moxa:', err);
    client.end();
    await delay(3000);
    client.connect({
        port: moxa_port,
        host: moxa_IP
    });
});

securos.connect((core) => {
    core.registerEventHandler('MACRO', '1.17', 'RUN', () => {
        client.write(tabloBuild(`[p2][v6][d1][f6] LOL `, 1), (err) => {
            if(err) console.log(err);
        })
        // client.write(setupClock(), (err) => {
        //     if(err) console.log(err);
        // })
    })
})