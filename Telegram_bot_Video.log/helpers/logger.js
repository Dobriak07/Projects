const path = require('path');
const LOG_PATH = './log';

const loggerConfig = {
    appenders: {
      console: { type: 'console', layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } },
      file: { type: 'file', filename: path.join(LOG_PATH, 'bot.log'), maxLogSize: 100000, backups: 5, layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } }
    },
    categories: {
      default: { appenders: [ 'console' ], level: 'trace' },
      console: { appenders: ['console'], level: 'off' },
      file: { appenders: ['file'], level: 'error' },
    }
};

module.exports = loggerConfig;