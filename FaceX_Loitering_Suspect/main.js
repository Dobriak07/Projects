// Modules section start
const path = require('path');
const securos = require('securos');
const { facexAPI } = require('facex_api'); // FaceX RestAPI methods file
const log4js = require('log4js'); // Logger
const { get } = require('http');
// Modules setion end

// Constants section start
const LOG_PATH = 'C:/Program Data/ISS/logs/modules/facex_suspects/'
const IP = '127.0.0.1'; // FaceX RestAPI IP
const PORT = 21093; // FaceX RestAPI port
const suspectListName = 'Suspects'; // Name for the suspects list
const matchThreshold = 0.7; // Suspect list match threshold
const monitoringTime = 1; // Minutes
const facex = new facexAPI(IP, PORT);
const timers = new Map();
// Constants section end
// Logger configuration start
log4js.configure({
    appenders: {
      console: { type: 'console' },
      file: { type: 'file', filename: path.join(LOG_PATH, 'suspects.log') }
    },
    categories: {
      default: { appenders: [ 'console' ], level: 'trace' },
      console: { appenders: ['console'], level: 'off' },
      file: { appenders: ['file'], level: 'error', maxLogSize: 10000, backups: 5, layout: { type: 'basic' } },
    }
});
let logger = log4js.getLogger('file');
let loggerConsole = log4js.getLogger('console');
// Logger configuration end

securos.connect(async (core) => {
    core.registerEventHandler('FACE_X_SERVER', '*', 'NO_MATCH', async (e) => {
        let noMatchData = JSON.parse(e.params.comment);
        try {
            let result = await noMatch(noMatchData.id);
    
            if (result.status == 201) {
                let timeout = setTimeout(deletePerson, monitoringTime*60000, result.data.id);
                timers.set(result.data.id, timeout);
                logger.debug(`Suspect found. Adding timer to id - ${result.data.id}`);
                loggerConsole.debug(`Suspect found. Adding timer to id - ${result.data.id}`);
            }
            else {
                logger.error(`Can't process logic. Reason: ${result.status}-${result.message}. Section: ${result.section}`);
                loggerConsole.error(`Can't process logic. Reason: ${result.status}-${result.message}. Section: ${result.section}`);
            }
        }
        catch(err) {
            if (err) {
                logger.error(`Can't process logic. Reason: ${err.message}`);
                loggerConsole.error(`Can't process logic. Reason: ${err.message}`);
            }
        }
    })

    core.registerEventHandler('FACE_X_SERVER', '*', 'MATCH', async (e) => {
        let matchData = JSON.parse(e.params.comment);
        
        if (matchData.list.name == suspectListName) {
            let options = {
                first_name: matchData.person.first_name,
                middle_name: matchData.person.middle_name,
                last_name: matchData.person.last_name,
                notes: JSON.stringify({modified: Date.now().toString()})
            }
            try {
                let changePerson = await facex.changePerson(matchData.person.id, options);
                clearTimeout(timers.get(matchData.person.id));
                let timeout = setTimeout(deletePerson, monitoringTime*60000, matchData.person.id);
                timers.set(matchData.person.id, timeout);
                logger.debug(`Reseting timer for suspect with id - ${result.data.id}`);
                loggerConsole.debug(`Reseting timer for suspect with id - ${result.data.id}`);
            }
            catch(err) {
                if (err) {
                    logger.error(`Can't process logic. Reason: ${err.message}`);
                    loggerConsole.error(`Can't process logic. Reason: ${err.message}`);
                }
            }
        }
    })

    async function noMatch(id) {
        try {
            let searchRes = await searchList(suspectListName);
            if (searchRes.status != 201) return {section: searchRes.section, status: searchRes.status, message: searchRes.statusText};

            let lastPersonId = searchRes.persons_count == 0 ? 1 : searchRes.persons_count + 1;
            let getDetection = await facex.getDetectionImage(id);
            if (getDetection != 200) return {section: 'Get detection', status: getDetection.status, message: getDetection.statusText};
            logger.debug(`Detection found`);
            loggerConsole.debug(`Detection found`);

            let image = await getDetection.buffer();
            let create = await createPerson(searchRes['id'], lastPersonId);
            if (create.status == 201) {
                let addImage = await addPersonImage(create.data.id, image);
                let response = await addImage.json();
                if (addImage.status == 201) {
                    logger.debug(`Image succesfully added. Result: ${addImage.status}-${addImage.message}. Section: ${addImage.section}`);
                    loggerConsole.debug(`Image succesfully added. Result: ${addImage.status}-${addImage.message}. Section: ${addImage.section}`);
                    return {section: addImage.section, status: addImage.status, message: addImage.statusText, data: response};
                }
                else {
                    return {section: addImage.section, status: addImage.status, message: addImage.statusText}; 
                }    
            }
            return {section: create.section, status: create.status, message: create.statusText};
        }
        catch (err) {
            if (err) throw err;
        };
    }

    async function searchList(name) {
        try {
            let getList = await facex.searchList(name);
            if (getList.status != 200) return {section: 'Search List', status: getList.status, message: getList.statusText};
            logger.debug(`List found`);
            loggerConsole.debug(`List found`);

            let response = await getList.json();
            if ( response.lists.length == 0 ) {
                let result =  await facex.createList(name, {priority: 0, match_threshold: matchThreshold});
                if (result.status == 201) {
                    logger.debug(`List created`);
                    loggerConsole.debug(`List created`);
                    await searchList(name);
                }
                else return {section: 'Create List', status: result.status, message: result.statusText};
            }
            return response.lists[0];
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function createPerson(listId, personId) {
        try {
            let createPerson = await facex.createPerson({
                first_name: 'Suspect', 
                last_name: personId, 
                notes: JSON.stringify({modified: Date.now().toString()}), 
                list_id: listId
            }); 
            let response = await createPerson.json();
            if (createPerson.status == 201) {
                logger.debug(`Person created`);
                loggerConsole.debug(`Person created`);
                return {status: createPerson.status, message: createPerson.statusText, data: response};
            }
            return {section: 'Create person', status: createPerson.status, message: createPerson.statusText};
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function addPersonImage(id, image) {
        try {
            let addImage = await facex.addPhotoFromFile(id, image);
            let response = await addImage.json();
            if (response == 201) {
                logger.debug(`Image added to person`);
                loggerConsole.debug(`Image added to person`);
                return {status: addImage.status, message: addImage.statusText, data: response};
            }
            return {section: 'Add person image', status: addImage.status, message: addImage.statusText};
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function deletePerson(id) {
        try {
            let response = await facex.deletePerson(id);
            if (response.status == 200) {
                logger.debug(`Person successfully deleted`);
                loggerConsole.debug(`Person successfully deleted`);
            }
        }
        catch(err) {
            if (err) throw err;
        }
    }
})