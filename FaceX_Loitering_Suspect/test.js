const { facexAPI } = require('facex_api');
const facex = new facexAPI('172.16.1.136', 21093);

async function watchDog() {
    let searchList = await facex.searchList('Suspects');
    if (searchList.status == 200) {
        let response = await searchList.json();
        // console.log(response);
        let getPersons = await facex.getListPersons(response.lists[0].id);
        // console.log(getPersons);
        if (getPersons.status == 200) {
            let personList = await getPersons.json();
            if (personList._pagination.total_records != 0) {
                // console.log(personList);
                for (person of personList.persons) {
                    // console.log(person);
                    console.log(person['last_name'], person["notes"])
                }
            }
        }
    }
}

watchDog();