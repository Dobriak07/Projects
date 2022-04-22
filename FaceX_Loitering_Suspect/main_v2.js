// Modules section start
const path = require('path');
const fs = require('fs');
const securos = require('securos');
const { facexAPI } = require('facex_api'); // FaceX RestAPI class file
const log4js = require('log4js'); // Logger
const fetch = require('node-fetch');
// Modules setion end

// Constants section start
const LOG_PATH = 'C:/ProgramData/ISS/logs/modules/Suspect'
const IP = '127.0.0.1'; // FaceX RestAPI IP
const PORT = 21093; // FaceX RestAPI port
const suspectListName = 'Suspects'; // Name for the suspects list
const matchThreshold = 0.5; // Suspect list match threshold
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
      file: { appenders: ['file'], level: 'error' },
    }
});
let logger = log4js.getLogger('file');
let loggerConsole = log4js.getLogger('console');
// Logger configuration end

securos.connect(async (core) => {
    setInterval(watchDog, watchdog * 1000);
    
    core.registerEventHandler('FACE_X_SERVER', '*', 'NO_MATCH', async (e) => {
        
        let noMatchData = JSON.parse(e.params.comment);
        try {
            let result = await noMatch(noMatchData.id);

            if (result.status == 201) {
                log('info', `New person. Added to suspects list. Id: ${JSON.stringify(result.id)}`);
            }
            else {
                log('error', `Can't process logic. Reason: ${result.status}-${result.message}. Section: ${result.section}`);
            }
        }
        catch(err) {
            if (err) {
                log('error', `Can't process logic. Reason: ${err.message}`);
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
                if (changePerson.status != 200) {
                    log('error', `Can't access and change person notes. Reason: ${changePerson.status}-${changePerson.statusText}`);
                }
                let data = {
                    image: matchData.detection._links.detection_image, 
                    id: matchData.person.id,
                    previous_modified: JSON.parse(matchData.person.notes).modified,
                    new_modified: modified
                }
                log('info', `Suspect found. Id: ${data.id}. Updating timestamp info.`);
                log('debug', `Suspect found. Id: ${data.id}. Updating timestamp info. Data: ${JSON.stringify(data)}`);
            }
            catch(err) {
                if (err) {
                    log('error', `Can't process logic. Reason: ${err.message}`);
                }
            }
        }
    })

    async function noMatch(id) {
        try {
            let searchRes = await searchList(suspectListName);
            
            if (searchRes.status != 200) return {section: searchRes.section, status: searchRes.status, message: searchRes.statusText};

            let lastPersonId = searchRes.data.persons_count == 0 ? 1 : searchRes.data.persons_count + 1;
            let getDetection = await facex.getAnnotatedImage(id);
                        
            if (getDetection.status != 200) return {section: 'Get detection', status: getDetection.status, message: getDetection.statusText};
            log('trace', `Detection found`);

            let image = await annotatedImageParse(getDetection, id);
            
            if (image.status != 200) return {section: image.section, status: image.status, message: image.message};

            let create = await createPerson(searchRes.data['id'], lastPersonId);

            if (create.status != 201) return {section: create.section, status: create.status, message: create.message};
                let addImage = await addPersonImage(create.data.id, image.data);
                if (addImage.status == 201) {
                    log('debug', `Image succesfully added. Person id: ${create.data.id}. Result: ${addImage.status}-${addImage.message}. Section: ${addImage.section}`);
                    return {section: addImage.section, status: addImage.status, message: addImage.message, data: addImage.data, id: create.data.id};
                }
                else if (addImage.status == 422) {
                    log('debug', `FaceX Server can't find face on image. Deleting person with id: ${create.data.id}. Image link: http://${IP}:${PORT}/v1/archive/detection/${id}/image`);
                    await deletePersonFromList(create.data.id);
                    return {section: addImage.section, status: addImage.status, message: addImage.message};
                }
                else {
                    await deletePersonFromList(create.data.id);
                    return {section: addImage.section, status: addImage.status, message: addImage.message}; 
                }    
        }
        catch (err) {
            if (err) log('trace', `No_match function: ${err.message}`);
        };
    }

    async function searchList(name) {
        try {
            let getList = await facex.searchList(name);
            if (getList.status != 200) return {section: 'Search List', status: getList.status, message: getList.statusText};
            log('trace', `List '${name}' found`);

            let response = await getList.json();
            if ( response.lists.length == 0 ) {
                let result =  await facex.createList(name, {priority: 0, match_threshold: matchThreshold});

                if (result.status != 201) return {section: 'Create List', status: result.status, message: result.statusText};
                log('debug', `List '${name}' created`);

                return await searchList(name);
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
            
            if (createPerson.status != 201) return {section: 'Create person', status: createPerson.status, message: createPerson.statusText};

            let response = await createPerson.json();
            log('trace', `Person created. Id: ${response.id}`);
            return {status: createPerson.status, message: createPerson.statusText, data: response};            
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function addPersonImage(id, image) {
        try {
            let addImage = await facex.addAnnotetedPhoto(id, image);

            if (addImage.status != 201) return {section: 'Add person image', status: addImage.status, message: addImage.statusText};
            
            let response = await addImage.json();
            log('trace', `Image added to person with id: ${id}`);
            return {section: 'Add person image', status: addImage.status, message: addImage.statusText, data: response};            
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function deletePersonFromList(id) {
        try {
            let deleteResult = await facex.deletePerson(id);
            if (deleteResult.status == 200) {
                let response = await deleteResult.json();
                log('info', `Person id: ${person.id}, last_name: ${person.last_name} successfully deleted`);
            }
            else {
                log('debug', `Can't delete person. Reason: ${deleteResult.status}-${deleteResult.statusText}`)
            }
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function watchDog() {
        try {
            let searchList = await facex.searchList('Suspects');

            if (searchList.status != 200) {
                log('error', `Can't find list. Reason: ${searchList.status}-${searchList.statusText}`);
                return;
            }

            let response = await searchList.json();
            let getPersons = await facex.getListPersons(response.lists[0].id);

            if (getPersons.status != 200) {
                log('error', `Can't get persons from list. Reason: ${getPersons.status}-${getPersons.statusText}`);
                return;
            }

            let personList = await getPersons.json();
            if (personList._pagination.total_records == 0) return;

            for (person of personList.persons) {
                let notes = JSON.parse(person.notes);

                if (notes.modified * 1 + monitoringTime * 60000 < Date.now()) {
                    log('debug', `Time to delete person id: ${person.id}`);
                    await deletePersonFromList(person.id);
                }
            }
        }
        catch (err) {
            if (err) {
                log('error', `Can't process watchdog. Reason: ${err.message}`);
            }
        }
    }

    async function annotatedImageParse(response, id) {
        try {
            let body = (await response.text()).replace(/(?:\\[rn]|[\r\n]+)+/g, '');
            let boundary = (await response.headers.get('content-type')).split('boundary=')[1].replace(/"/g,'');
            let bbox = JSON.parse(body.split(boundary)[2].split(`"data"`)[1].replace(/-/g,''));
            let getImage = await facex.getDetectionImage(id);
            if (getImage.status == 200) {
                let image = await getImage.buffer();
                let result = {
                    image: image,
                    hint_bbox: bbox.bbox_on_image
                }
                return {section: "Get Image", status: getImage.status, message: getImage.statusText, data: result}
            }
            return {section: "Get Image", status: getImage.status, message: getImage.statusText};
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function log(level = 'off', message = '') {
        logger[level](message);
        loggerConsole[level](message);
    }
})