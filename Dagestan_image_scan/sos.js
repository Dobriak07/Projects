const securos = require('securos');
const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const exif = require('exifreader');
const delay = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));

securos.connect((core) => {
    core.registerEventHandler('MACRO', '1.19', 'RUN', async (e) => {
        console.log('Macro pressed');

        let res = await fetch('http://127.0.0.1:21093/v1/spotter/import/session', {method: 'POST'});
        if(res.status == 201) {
            let image = await fs.promises.readFile('D:/17374.jpg');
            let form = new FormData();
            form.append('data', JSON.stringify({
                "source": "17374.jpg",
                "first_name": "Foo",
                "middle_name": "Bar",
                "last_name": "Baz"
                }), {contentType: 'application/json'});
            form.append('image', image, {contentType: 'image/jpeg'});
            let sessionId = await res.json();
            console.log(sessionId.id);
            let resAdd = await fetch(`http://127.0.0.1:21093/v1/spotter/import/session/${sessionId.id}?action=add_image`, {method: 'POST', body: form});
            if(resAdd.status == 201) {
                let processStart = await fetch(`http://127.0.0.1:21093/v1/spotter/import/session/${sessionId.id}?action=process`, {method: 'POST'});
                console.log(processStart.status);
                if(processStart.status == 202) {
                    let sessionStatus = await getSessionStatus(sessionId.id);
                    console.log(sessionStatus);
                    console.log(sessionStatus.items[0]._links);
                    console.log(sessionStatus.items[0].faces);
                }
            }
        }
    })

    async function getSessionStatus(id) {
        let res = {state: 'null'};
        while (res.state != 'completed') {
            response = await fetch(`http://127.0.0.1:21093/v1/spotter/import/session/${id}`, {method: 'GET'});
            if(response.status == 200) {
                res = await response.json();
                await delay(1000);
            }
        }
        return res;
    }
})