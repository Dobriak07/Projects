require('dotenv').config();
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const chatId = -1001621494083;
const LOG_PATH = "C:/ProgramData/ISS/logs/";
const LOG_NAME = "video.fs.log";
let users = [];
let last_line = 0;
const delay = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));
let count = 1;
let state = 0;

const token = '5037540232:AAFLWD39tVbeqgcbEQxQrGH1ZSwcbjCU6nk';
const bot = new TelegramBot(token, {polling: true});

bot.on('channel_post', (msg) => {
    if (msg.text == '/options') {
        bot.sendMessage(msg.chat.id, "Choose option", {
            reply_markup: {
                inline_keyboard: [[{
                        text: "Start videoFS.log parse",
                        callback_data: "Start"
                    }],
                    [{
                        text: "Stop videoFS.log parse",
                        callback_data: "Stop"
                    }]]
                }
        });
    }
    // console.log(msg);
    // let chat_id = msg.chat.id;
    // bot.sendMessage(chatId, 'Privet');
})

bot.on('callback_query', (query) => {
    console.log(query);
    if (query.data == 'Stop') {
        bot.answerCallbackQuery(query.id, {text: 'Parse stop'});
        state = 0;
    }
    if (query.data == 'Start') {
        bot.answerCallbackQuery(query.id, {text: 'Parse start'});
        state = 1;
    }
})

bot.on('message', (msg) => {
    let start = "Start videoFS.log parse";
    let stop = "Stop videoFS.log parse";
    if (msg.text.toString().toLowerCase().includes(start)) {
        bot.sendMessage(msg.chat.id, "Bot start");
        state = 1;
        return;
    }
    if (msg.text.toString().toLowerCase().includes(stop)) {
        bot.sendMessage(msg.chat.id, "Bot stop");
        state = 0;
        return;
    }
});

async function app() {
    try {
        bot.setMyCommands([
            {
                command: '/options',
                description: 'Choose option'
            }
        ], {
            scope: 'all_group_chats'
        })
        while (count > 0) {
            read_log();
            await delay(10000);
        }
    }
    catch(err) {
        if (err) console.log(err.message);
    }
}

async function read_log() {
    fs.readFile(path.join(LOG_PATH, LOG_NAME), (err, data) => {
        if (err) {return console.log(err)}
        let text = data.toString();
        let lines = text.split('\n');
        let actual_last = lines.length - 2;
        let slow_count = 0;
        let frame_skip_count = 0;

        if (last_line == 0 && last_line < actual_last) {
            if (lines[actual_last].includes('WARN')) {
                if (lines[actual_last].includes('Very long operation')) {slow_count++}
                else if (lines[actual_last].includes('frames were missed')) {frame_skip_count++}
                else {console.log('Another ERROR')};
            }
        }
        else if (last_line < actual_last) {
            console.log('Diff', actual_last - last_line);
            for (let i = last_line; i <= actual_last; i++) {
                // console.log(lines[i]);
                if (lines[i].includes('WARN')) {
                    if (lines[i].includes('Very long operation')) {slow_count++}
                    else if (lines[i].includes('frames were missed')) {frame_skip_count++}
                    else {console.log('Another ERROR')};
                }
            }
        }
        else if (last_line > actual_last) {
            console.log('last line bigger actual last')
            for (item of lines) {
                if (lines[item].includes('WARN')) {
                    if (lines[item].includes('Very long operation')) {slow_count++}
                    else if (lines[item].includes('frames were missed')) {frame_skip_count++}
                    else {console.log('Another ERROR')};
                }
            }
        }
            
        last_line = actual_last;
        count++;
        console.log('Slow Record Count:', slow_count);
        console.log('Frame Skip Count:', frame_skip_count);
            
        if (slow_count != 0 && state == 1) {
            bot.sendMessage(chatId, `Detected Very Long Operation. Problems Count: ${slow_count}`);
        }
        if (frame_skip_count != 0 && state == 1) {
            bot.sendMessage(chatId, `Detected Frames Missing. Problems Count: ${frame_skip_count}`);
        }
    });
    
}

app();