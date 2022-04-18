const { facexAPI } = require('./facex_api'); // API methods file
const IP = '172.16.1.136'; // FaceX API IP
const PORT = 21093; // FaceX API port
const suspectListName = 'Suspects'; // Name for the suspects list
const monitoringTime = 10; // Minutes
const facex = new facexAPI(IP, PORT);

async function test() {
    try {
        let searchRes = await searchList(suspectListName);
        if (searchRes == false) return `Cannot create and access list. Reason: ${searchRes}`;

        let lastPersonId = search.persons_count == 0 ? 1 : search.persons_count + 1;
    
        let getDetection = await facex.getDetectionImage(179200);
        let image = await getDetection.buffer();

        let res = await createPersonAddImage(searchRes['id'], lastPersonId, image);
        if (res !== 'ok') {console.log(res)};
    }
    catch (err) {
        if (err) return err.message;
    };

    async function searchList(name) {
        try {
            let getList = await facex.searchList(name);
            let response = await getList.json();
            if ( response.lists.length == 0 ) {
                let res =  await facex.createList(name, {priority: 0, match_threshold: 0.7});
                if (res.status == 201) {
                    return await searchList(name);
                }
                else return res.status;
            }
            return res.lists[0];
        }
        catch(err) {
            if (err) throw err;
        }
    }

    async function createPersonAddImage(listId, personId, image) {
        try {
            let createPerson = await facex.createPerson({last_name: personId, list_id: listId}); 
            let response = await createPerson.json();
            if (createPerson.status == 201) {
                let addImage = await facex.addPhotoFromFile(response.id, image);
                return addImage.status == 201 ? 'ok' : createPerson.status;
            }
            else return createPerson.status;
        }
        catch(err) {
            if (err) throw err;
        }
    }
}

async function test2() {
    let res = await test();
    console.log(res);
}

test2();