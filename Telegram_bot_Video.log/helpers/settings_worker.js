const fs = require('fs');
const { findSourceMap } = require('module');

function readSettings(SETTINGS_JSON) {
    try {
        if(fs.existsSync(SETTINGS_JSON)) {
            console.log('Settings file exists');
            return JSON.parse(fs.readFileSync(SETTINGS_JSON));
        }
        else {
            console.log('No File. Creating default. Edit token in file after creation and add bot to chat again');
            fs.writeFileSync(SETTINGS_JSON, JSON.stringify({
                chatId: 0,
                token: "",
                LOG_PATH: "C:/ProgramData/ISS/logs/",
                LOG_NAME: "video.fs.log",
                state: "0",
                filter: [],
                parse_phrases: ["WARN"],
                phrases: ["Very long operation","Frames were missed","Files queue size"],
                last_line: 0
            }));
            return 'created';
        }
    }
    catch(e) {
        if (e) console.log(e.message);
    }
}

function saveSettings(SETTINGS_JSON, settings) {
    try {
        fs.writeFileSync(SETTINGS_JSON, JSON.stringify(settings));
    }
    catch(e) {
        if (e) console.log(e.message);
    }
}

module.exports = { readSettings, saveSettings};