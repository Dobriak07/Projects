// Modules section start
const path = require('path');
const fs = require('fs');
const securos = require('securos');
const { facexAPI } = require('facex_api'); // FaceX RestAPI methods file
const log4js = require('log4js'); // Logger
// Modules setion end

// Constants section start
const LOG_PATH = 'C:/ProgramData/ISS/logs/modules/Suspect'
const IP = '127.0.0.1'; // FaceX RestAPI IP
const PORT = 21093; // FaceX RestAPI port
const suspectListName = 'Suspects'; // Name for the suspects list
const matchThreshold = 0.7; // Suspect list match threshold
const monitoringTime = 2; // In minutes
const watchdog = 10; // In seconds
const facex = new facexAPI(IP, PORT);
// Constants section end
// Logger configuration start
log4js.configure({
    appenders: {
      console: { type: 'console', layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } },
      file: { type: 'file', filename: path.join(LOG_PATH, 'suspects.log'), maxLogSize: 10000, backups: 5, layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } }
    },
    categories: {
      default: { appenders: [ 'console' ], level: 'trace' },
      console: { appenders: ['console'], level: 'off' },
      file: { appenders: ['file'], level: 'debug' },
    }
});
let logger = log4js.getLogger('file');
let loggerConsole = log4js.getLogger('console');
// Logger configuration end

securos.connect(async (core) => {
    setInterval(watchDog, watchdog*1000);
    
    core.registerEventHandler('FACE_X_SERVER', '*', 'NO_MATCH', async (e) => {
        let noMatchData = JSON.parse(e.params.comment);
        try {
            let result = await noMatch(noMatchData.id);

            if (result.status == 201) {
                logger.info(`New person. Added to suspects list. Id: ${JSON.stringify(result.id)}`);
                loggerConsole.info(`New person. Added to suspects list. Id: ${JSON.stringify(result.id)}`);
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
            let modified = Date.now();
            let count = JSON.parse(matchData.person.notes).count + 1;
            let options = {
                first_name: matchData.person.first_name,
                middle_name: matchData.person.middle_name,
                last_name: matchData.person.last_name,
                notes: JSON.stringify({modified: modified.toString(), count: count})
            }
            try {
                let changePerson = await facex.changePerson(matchData.person.id, options);
                let data = {
                    image: matchData.detection._links.detection_image, 
                    id: matchData.person.id,
                    previous_modified: JSON.parse(matchData.person.notes).modified,
                    new_modified: modified
                }
                logger.info(`Suspect found. Id: ${data.id}. Updating timestamp info.`);
                loggerConsole.info(`Suspect found. Id: ${data.id}. Updating timestamp info.`);
                logger.debug(`Suspect found. Id: ${data.id}. Updating timestamp info. Data: ${JSON.stringify(data)}`);
                loggerConsole.debug(`Suspect found. Id: ${data.id}. Updating timestamp info. Data: ${JSON.stringify(data)}`);
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
            if (searchRes.status != 200) return {section: searchRes.section, status: searchRes.status, message: searchRes.statusText};

            let lastPersonId = searchRes.data.persons_count == 0 ? 1 : searchRes.data.persons_count + 1;
            let getDetection = await facex.getDetectionImage(id);
            if (getDetection.status != 200) return {section: 'Get detection', status: getDetection.status, message: getDetection.statusText};
            logger.trace(`Detection found`);
            loggerConsole.trace(`Detection found`);

            let image = await getDetection.buffer();
            let create = await createPerson(searchRes.data['id'], lastPersonId);
            if (create.status == 201) {
                let addImage = await addPersonImage(create.data.id, image);
                if (addImage.status == 201) {
                    logger.debug(`Image succesfully added. Person id: ${create.data.id}. Result: ${addImage.status}-${addImage.message}. Section: ${addImage.section}`);
                    loggerConsole.debug(`Image succesfully added. Person id: ${create.data.id}. Result: ${addImage.status}-${addImage.message}. Section: ${addImage.section}`);
                    return {section: addImage.section, status: addImage.status, message: addImage.message, data: addImage.data, id: create.data.id};
                }
                else if (addImage.status == 422) {
                    let deleteBad = await facex.deletePerson(create.data.id);
                    logger.debug(`FaceX Server can't find face on image. Deleting person with id: ${create.data.id}. Image link: http://${IP}:${PORT}/v1/archive/detection/${id}/image`);
                    loggerConsole.debug(`FaceX Server can't find face on image. Deleting person with id: ${create.data.id}. Image link: http://${IP}:${PORT}/v1/archive/detection/${id}/image`);
                    return {section: addImage.section, status: addImage.status, message: addImage.message};
                }
                else {
                    return {section: addImage.section, status: addImage.status, message: addImage.message}; 
                }    
            }
            return {section: create.section, status: create.status, message: create.message};
        }
        catch (err) {
            if (err) throw err;
        };
    }

    async function searchList(name) {
        try {
            let getList = await facex.searchList(name);
            if (getList.status != 200) return {section: 'Search List', status: getList.status, message: getList.statusText};
            logger.trace(`List '${name}' found`);
            loggerConsole.trace(`List '${name}' found`);

            let response = await getList.json();
            if ( response.lists.length == 0 ) {
                let result =  await facex.createList(name, {priority: 0, match_threshold: matchThreshold});
                if (result.status == 201) {
                    logger.debug(`List '${name}' created`);
                    loggerConsole.debug(`List '${name}' created`);
                    await searchList(name);
                }
                else {
                    return {section: 'Create List', status: result.status, message: result.statusText};
                }
            }
            return {section: 'Search List', status: getList.status, message: getList.statusText, data: response.lists[0]};
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
                notes: JSON.stringify({modified: Date.now().toString(), count: 1}), 
                list_id: listId
            }); 
            
            if (createPerson.status == 201) {
                let response = await createPerson.json();
                logger.trace(`Person created. Id: ${response.id}`);
                loggerConsole.trace(`Person created. Id: ${response.id}`);
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
            if (addImage.status == 201) {
                let response = await addImage.json();
                logger.trace(`Image added to person with id: ${id}`);
                loggerConsole.trace(`Image added to person with id: ${id}`);
                return {section: 'Add person image', status: addImage.status, message: addImage.statusText, data: response};
            }
            return {section: 'Add person image', status: addImage.status, message: addImage.statusText};
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function deletePerson(id) {
        try {
            let deletePerson = await facex.deletePerson(id);
            if (deletePerson.status == 200) {
                let response = await deletePerson.json();
                logger.debug(`Person successfully deleted. Data: ${response}`);
                loggerConsole.debug(`Person successfully deleted. Data: ${response}`);
            }
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function watchDog() {
        try {
            let searchList = await facex.searchList('Suspects');
            if (searchList.status == 200) {
                let response = await searchList.json();
                let getPersons = await facex.getListPersons(response.lists[0].id);
                if (getPersons.status == 200) {
                    let personList = await getPersons.json();
                    if (personList._pagination.total_records != 0) {
                        for (person of personList.persons) {
                            let notes = JSON.parse(person.notes);
                            if (notes.modified * 1 + monitoringTime * 60000 < Date.now()) {
                                logger.debug(`Time to delete person id: ${person.id}`);
                                loggerConsole.debug(`Time to delete person id: ${person.id}`);
    
                                let deletePerson = await facex.deletePerson(person.id);
                                if (deletePerson.status == 200) {
                                    logger.info(`Person id: ${person.id}, last_name: ${person.last_name} successfully deleted`);
                                    loggerConsole.info(`Person id: ${person.id}, last_name: ${person.last_name} successfully deleted`);
                                }
                                else {
                                    logger.debug(`Can't delete person. Reason: ${deletePerson.status}-${deletePerson.statusText}`);
                                    loggerConsole.debug(`Can't delete person. Reason: ${deletePerson.status}-${deletePerson.statusText}`);
                                }
                            }
                        }
                    }
                }
                else {
                    logger.error(`Can't get persons from list. Reason: ${getPersons.status}-${getPersons.statusText}`);
                    loggerConsole.error(`Can't get persons from list. Reason: ${getPersons.status}-${getPersons.statusText}`);
                }
            }
            else {
                logger.error(`Can't find list. Reason: ${searchList.status}-${searchList.statusText}`);
                loggerConsole.error(`Can't find list. Reason: ${searchList.status}-${searchList.statusText}`);
            }
        }
        catch (err) {
            if (err) {
                logger.error(`Can't process watchdog. Reason: ${err.message}`);
                loggerConsole.error(`Can't process watchdog. Reason: ${err.message}`);
            }
        }
    }
})