const dedent = require('dedent');
const readLog = require('./helpers/file_parser');
const { readSettings, saveSettings } = require('./helpers/settings_worker');
const { Telegraf, Markup } = require('telegraf');
const SETTINGS_JSON = './config.json';
const delay = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));
const log4js = require('log4js');
const loggerConfig = require('./helpers/logger');
let j = 1;

log4js.configure(loggerConfig);
let logger = log4js.getLogger('file');

async function app() {
    try {
        let settings = readSettings(SETTINGS_JSON);
        if (settings == 'created') {
            await delay(6000);
            return;
        }
        const choises = settings.phrases;
        const buildChoises = () => {
            let arr = [];
            let i = 1;
            for (const ch of choises) {
                arr.push(Markup.button.callback(ch, `${i}`));
                i++;
            }
            return arr;
        }
        const checkFilter = () => Markup.inlineKeyboard([ buildChoises(), [Markup.button.callback('Done', 'done')] ]);
        const delayKeyboard = Markup.inlineKeyboard([ 
            [ 
                Markup.button.callback('1', '4'),
                Markup.button.callback('3', '5'),
                Markup.button.callback('5', '6'),
                Markup.button.callback('10', '7'),
            ]
        ]);
    
        let bot = new Telegraf(settings.token);
    
        bot.telegram.getMe().then((botInfo) => {
            bot.options.username = botInfo.username
        });
        await bot.telegram.setMyCommands([
            { command: 'help', description: 'show this help' },
            { command: 'start', description: 'start log file parsing' },
            { command: 'stop', description: 'stop log file parsing' },
            {
                command: 'options',
                description: 'show inline keyboard to choose which problems to parse'
            }, 
            { command: 'time', description: 'log scan frequincy' }
        ]);
    
        bot.on('my_chat_member', (ctx) => {
            console.log(ctx.update.my_chat_member.chat.id);
            settings.chatId = ctx.update.my_chat_member.chat.id;
            saveSettings(SETTINGS_JSON, settings);
        });
        bot.on('channel_post', (ctx, next) => {
            ctx.update.message = ctx.update.channel_post
            return next()
        })
        bot.help(async (ctx) => {
            ctx.replyWithHTML(dedent(`
                <code>/help</code> - show this help
                <code>/start</code> - start log file parsing
                <code>/stop</code> - stop log file parsing
                <code>/options</code> - show inline keyboard to choose which problems to parse
                <code>/time</code> - log scan frequincy  
            `));
        });
        bot.command('start', (ctx) => {
            ctx.telegram.sendMessage(ctx.update.message.chat.id, 'Parsing started');
            settings.state = 1;
        });
        bot.command('stop', (ctx) => {
            ctx.telegram.sendMessage(ctx.update.message.chat.id, 'Parsing stopped');
            settings.state = 0;
        });
        bot.command('options', (ctx) => {
            ctx.telegram.sendMessage(ctx.update.message.chat.id, 'Which problems to parse', checkFilter());
        });
    
        bot.command('time', (ctx) => {
            ctx.telegram.sendMessage(ctx.update.message.chat.id, 'Choose log scan frequincy', delayKeyboard);
        });
    
        bot.action(/[1-3]/, (ctx) => {
            console.log(ctx.match[0]);
            if (choises[ctx.match[0] - 1].includes('✔️')) {
                choises[ctx.match[0] - 1] = choises[ctx.match[0] - 1].split('✔️')[1].trim();
            } else {
                choises[ctx.match[0] - 1] = `✔️ ${choises[ctx.match[0] - 1]}`;
            }
            console.log(choises[ctx.match[0] - 1]);
            ctx.editMessageText('Choose', checkFilter());
        });
    
        bot.action('done', (ctx) => {
            let arr = [];
            let saveArr = [];
            for (ch of choises) {
                if (ch.includes('✔️')) {
                    arr.push(ch);
                    saveArr.push(ch.split('✔️')[1].trim());
                }
            }
            console.log(arr);
            console.log(saveArr);
            settings.filter = saveArr;
            saveSettings(SETTINGS_JSON, settings);
            ctx.editMessageText(`I will look for [ ${arr.join(' | ')} ] problems`);
        });
    
        bot.action(/[4-7]/, (ctx) => {
            for (i of delayKeyboard.reply_markup.inline_keyboard[0]) {
                if (i.callback_data == ctx.match[0]) {
                    settings.delay = i.text * 1;
                    saveSettings(SETTINGS_JSON, settings);
                    ctx.editMessageText(`Frequincy now ${i.text} seconds`);
                }
            }
        })
    
        bot.launch();
    
        while (j > 0) {
            if (settings.state == 1) {
                let msg = '';
                let res = await readLog(settings);
                // console.log(res.filterCounters);
                for (filter of settings.filter) {
                    if (res.filterCounters[filter] != 0) {
                        msg = msg + `<code>${filter}</code>` + ` lines: ${res.filterCounters[filter]}` + '\n';
                    }
                }
                if (msg.length > 0) {
                    bot.telegram.sendMessage(settings.chatId, msg, { parse_mode: 'HTML' });
                }
                settings.last_line = res._settings.last_line;
                saveSettings(SETTINGS_JSON, settings);
            }
            j++;
            await delay(settings.delay * 1000);
        }
    
        process.once('SIGINT', () => bot.stop('SIGINT'))
        process.once('SIGTERM', () => bot.stop('SIGTERM'))
    }
    catch(e) {
        if(e) {
            console.log(e.message);
            logger(e.message);
            app();
        }
    }
}

app();