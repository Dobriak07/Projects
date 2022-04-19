const securos = require('securos');
const { facexAPI } = require('facex_api'); // FaceX RestAPI methods file
const IP = '127.0.0.1'; // FaceX RestAPI IP
const PORT = 21093; // FaceX RestAPI port
const suspectListName = 'Suspects'; // Name for the suspects list
const suspectListMatchThreshold = 0.7; // Match persentage
const monitoringTime = 1; // Minutes
const facex = new facexAPI(IP, PORT);
const timers = new Map();

securos.connect(async (core) => {
    core.registerEventHandler('FACE_X_SERVER', '*', 'NO_MATCH', async (e) => {
        let noMatchData = JSON.parse(e.params.comment);
        let result = await noMatch(noMatchData.id);
        // console.log(result.data);
        // console.log(`${result.status} - ${result.message}`);
        if (result.status == 201) {
            let timeout = setTimeout(deletePerson, monitoringTime*60000, result.data.id);
            timers.set(result.data.id, timeout);
        }
    })

    core.registerEventHandler('FACE_X_SERVER', '*', 'MATCH', async (e) => {
        let matchData = JSON.parse(e.params.comment);
        
        if (matchData.list.name == suspectListName) {
            // console.log(matchData);
            // console.log('Before:',matchData.person.notes);
            let options = {
                first_name: matchData.person.first_name,
                middle_name: matchData.person.middle_name,
                last_name: matchData.person.last_name,
                notes: JSON.stringify({modified: Date.now().toString()})
            }
            // console.log('After:',options.notes);
            let changePerson = await facex.changePerson(matchData.person.id, options);
            clearTimeout(timers.get(matchData.person.id));
            let timeout = setTimeout(deletePerson, monitoringTime*60000, matchData.person.id);
            timers.set(matchData.person.id, timeout);
            // console.log(changePerson.status);
        }
    })

    async function noMatch(id) {
        try {
            let searchRes = await searchList(suspectListName);
            
            let lastPersonId = searchRes.persons_count == 0 ? 1 : searchRes.persons_count + 1;
            let getDetection = await facex.getDetectionImage(id);
            let image = await getDetection.buffer();

            let res = await createPersonAddImage(searchRes['id'], lastPersonId, image);
            return res
        }
        catch (err) {
            if (err) return err.message;
        };
    }

    async function searchList(name) {
        try {
            let getList = await facex.searchList(name);
            let response = await getList.json();
            if ( response.lists.length == 0 ) {
                let result =  await facex.createList(name, {priority: 0, match_threshold: suspectListMatchThreshold});
                if (result.status == 201) {
                    return await searchList(name);
                }
                else return {status: result.status, message: result.statusText};
            }
            return response.lists[0];
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function createPersonAddImage(listId, personId, image) {
        try {
            let createPerson = await facex.createPerson({
                first_name: 'Suspect', 
                last_name: personId, 
                notes: JSON.stringify({modified: Date.now().toString()}), 
                list_id: listId
            }); 
            let response = await createPerson.json();
            if (createPerson.status == 201) {
                let addImage = await facex.addPhotoFromFile(response.id, image);
                return addImage.status == 201 ? {
                    status: createPerson.status,
                    message: createPerson.statusText,
                    data: response
                } : {
                    status: createPerson.status,
                    message: createPerson.statusText
                };
            }
            else return { status: createPerson.status, message: createPerson.statusText };
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function deletePerson(id) {
        let response = await facex.deletePerson(id);
        if (response.status == 200) {
            console.log(`Person deleted: ${response.statusText}`);
        }
    }
})