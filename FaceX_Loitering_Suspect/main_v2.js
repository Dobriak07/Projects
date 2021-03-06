// Modules section
const path = require('path');
const securos = require('securos');
const { facexAPI } = require('facex_api'); // FaceX RestAPI class file
const log4js = require('log4js'); // Logger
// Modules setion

// Constants section
const LOG_PATH = 'C:/ProgramData/ISS/logs/modules/Suspect'
const SUSPECT_LIST = 'Suspects'; // Name for the suspects list
const SCAMMERS_LIST = 'Scammers'; // Name for the scammers list
const matchThreshold = 0.5; // Suspect list match threshold
const monitoringTime = 10; // In minutes
const detectionCount = 5; // After reaching this value person will be moved from suspects to scammers list
const watchdog = 10; // In seconds
// Constants section

// Logger section
log4js.configure({
    appenders: {
      console: { type: 'console', layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } },
      file: { type: 'file', filename: path.join(LOG_PATH, 'suspects.log'), maxLogSize: 100000, backups: 5, layout: { type: 'pattern', pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%-5p] %m' } }
    },
    categories: {
      default: { appenders: [ 'console' ], level: 'trace' },
      console: { appenders: ['console'], level: 'off' },
      file: { appenders: ['file'], level: 'error' },
    }
});
let logger = log4js.getLogger('file');
let loggerConsole = log4js.getLogger('console');
// Logger section

securos.connect(async (core) => {
    let faceServersList = await faceServers();
    setInterval(watchDog, watchdog * 1000, faceServersList);

    core.registerEventHandler('FACE_X_SERVER', '*', 'NO_MATCH', async (e) => {
        let conn = faceServersList.get(e.sourceId);
        let facex = new facexAPI(conn.ip, conn.port);
        let noMatchData = JSON.parse(e.params.comment);
        try {
            let result = await noMatch(facex, noMatchData.id);

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

        if (matchData.list.name == SUSPECT_LIST) {
            let conn = faceServersList.get(e.sourceId);
            let facex = new facexAPI(conn.ip, conn.port);
            let modified = Date.now();
            let _count = JSON.parse(matchData.person.notes).count;
            let count = _count + 1 ;
    
            try {
                if (count >= detectionCount) {
                    let searchRes = await searchList(facex, SCAMMERS_LIST);
                    if (searchRes.status != 200) return {section: searchRes.section, status: searchRes.status, message: searchRes.statusText};

                    let move = await movePerson(facex, searchRes.data.id, matchData.person.id);
                    if (move.status == 200) {
                        await deletePersonFromList(facex, matchData.list.id, matchData.person.id);
                        return;
                    }
                }
            }
            catch(err) {
                if (err) log(`Can't move person to list ${SCAMMERS_LIST}. Reason: ${err.message}`);
            }

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
                log('info', `Suspect found. Id: ${data.id}. Updating timestamp and count info.`);
                log('debug', `Suspect found. Id: ${data.id}. Updating timestamp and count info. Data: ${JSON.stringify(data)}`);
            }
            catch(err) {
                if (err) {
                    log('error', `Can't process logic. Reason: ${err.message}`);
                }
            }
        }
    })

    async function noMatch(facex, id) {
        try {
            let searchRes = await searchList(facex, SUSPECT_LIST);

            if (searchRes.status != 200) return {section: searchRes.section, status: searchRes.status, message: searchRes.statusText};
            
            let timeZone = (new Date()).getTimezoneOffset()*60000;
            let last_name = new Date(Date.now() - timeZone).toISOString().replace('T', ' ').replace('Z', '');
            let getDetection = await facex.getAnnotatedImage(id);

            if (getDetection.status != 200) return {section: 'Get detection', status: getDetection.status, message: getDetection.statusText};
            log('trace', `Detection found`);

            let image = await annotatedImageParse(facex, getDetection, id);

            if (image.status != 200) return {section: image.section, status: image.status, message: image.message};

            let create = await createPerson(facex, searchRes.data['id'], last_name);

            if (create.status != 201) return {section: create.section, status: create.status, message: create.message};

            let addImage = await addPersonImage(facex, create.data.id, image.data);
            if (addImage.status == 201) {
                log('debug', `Image succesfully added. Person id: ${create.data.id}. Result: ${addImage.status}-${addImage.message}. Section: ${addImage.section}`);
                return {section: addImage.section, status: addImage.status, message: addImage.message, data: addImage.data, id: create.data.id};
            }
            else if (addImage.status == 422) {
                log('debug', `FaceX Server can't find face on image. Deleting person with id: ${create.data.id}. Image link: http://${facex.ip}:${facex.port}/v1/archive/detection/${id}/image`);
                await deletePersonFromList(facex, searchRes.data.id, create.data.id);
                return {section: addImage.section, status: addImage.status, message: addImage.message};
            }
            else {
                await deletePersonFromList(facex, searchRes.data.id, create.data.id);
                return {section: addImage.section, status: addImage.status, message: addImage.message};
            }
        }
        catch (err) {
            if (err) log('trace', `No_match function: ${err.message}`);
        };
    }

    async function searchList(facex, name) {
        try {
            let getList = await facex.searchList(name);
            if (getList.status != 200) return {section: 'Search List', status: getList.status, message: getList.statusText};
            log('trace', `List '${name}' found`);

            let response = await getList.json();
            if ( response.lists.length == 0 ) {
                let result =  await facex.createList(name, {priority: 0, match_threshold: matchThreshold});

                if (result.status != 201) return {section: 'Create List', status: result.status, message: result.statusText};
                log('debug', `List '${name}' created`);

                return await searchList(facex, name);
            }
            return {section: 'Search List', status: getList.status, message: getList.statusText, data: response.lists[0]};
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function createPerson(facex, listId, personId) {
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

    async function addPersonImage(facex, id, image) {
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

    async function deletePersonFromList(facex, listId, personId) {
        try {
            let deleteResult = await facex.deletePersonFromList(listId, personId);
            if (deleteResult.status == 200) {
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

    async function movePerson(facex, listId, personId) {
        try{
            let move = await facex.movePerson(listId, personId);
            return {section: 'Move Person', status: move.status, message: move.statusText};
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function annotatedImageParse(facex, response, id) {
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

    async function watchDog(face_list) {
        try {
            let i = 1;
            for (key of face_list.keys()) {
                if (i == 1) {
                    let conn = face_list.get(key);
                    let facex = new facexAPI(conn.ip, conn.port)
                    let searchList = await facex.searchList(SUSPECT_LIST);

                    if (searchList.status != 200) {
                        log('error', `Can't find list. Reason: ${searchList.status}-${searchList.statusText}`);
                        return;
                    }

                    let response = await searchList.json();
                    let listId = response.lists[0].id;
                    let getPersons = await facex.getListPersons(listId);

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
                            await deletePersonFromList(facex, listId, person.id);
                        }
                    }
                    break;
                }
            }
        }
        catch (err) {
            if (err) {
                log('error', `Can't process watchdog. Reason: ${err.message}`);
            }
        }
    }

    async function faceServers() {
        let facexConnection = new Map();
        let servers = await core.getObjectsIds('FACE_X_SERVER');
        for (id of servers) {
            let server = await core.getObject('FACE_X_SERVER', id);
            let slave = await core.getObject(server.parentType, server.parentId);
            if (slave.params.ip_address != '') {
                facexConnection.set(id, {ip: slave.params.ip_address, port: server.params.port})
            }
            else { facexConnection.set(id, {ip: server.parentId, port: server.params.port}) }
            return facexConnection;
        }
    }

    async function log(level = 'off', message = '') {
        logger[level](message);
        loggerConsole[level](message);
    }
})