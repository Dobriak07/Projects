const fs = require('fs');
const path = require('path');

module.exports = async function read_log(_settings) {
    return new Promise((resolve, reject) => {
        let LOG_PATH = _settings.LOG_PATH;
        let LOG_NAME = _settings.LOG_NAME;
        let filters = _settings.filter;
        
        let filterCounters = (() => {
            let _filters = {};
            for (filter of filters) {
                _filters[filter] = 0;
            }
            return _filters;
        })();

        fs.readFile(path.join(LOG_PATH, LOG_NAME), (err, data) => {
            if (err) {return reject(err)}
            let text = data.toString();
            let lines = text.split('\n');
            let actual_last = lines.length - 2;

            if (_settings.last_line == 0 && _settings.last_line < actual_last) {
                for (parsePhrase of _settings.parse_phrases) {
                    if (lines[actual_last].toLowerCase().includes(parsePhrase.toLowerCase())) {
                        for (filter of filters) {
                            if (lines[actual_last].toLowerCase().includes(filter.toLowerCase())) { filterCounters[filter]++ }
                        }
                    }
                }
            }
            else if (_settings.last_line < actual_last) {
                console.log('Diff', actual_last - _settings.last_line);
                for (let i = _settings.last_line; i <= actual_last; i++) {
                    for (parsePhrase of _settings.parse_phrases) {
                        if (lines[i].toLowerCase().includes(parsePhrase.toLowerCase())) {
                            for (filter of filters) {
                                if (lines[i].toLowerCase().includes(filter.toLowerCase())) { filterCounters[filter]++ }
                            }
                        }
                    }
                }
            }
            else if (_settings.last_line > actual_last) {
                console.log('last line bigger actual last')
            }
                
            _settings.last_line = actual_last;
            resolve({ filterCounters, _settings });
        });
    })
}