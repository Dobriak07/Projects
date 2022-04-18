const fetch = require('node-fetch');

const facexAPI = class {
    constructor(ip = '127.0.0.1', port = 21093) {
        this.ip = ip;
        this.port = port;
    }

    getAllLists = async () => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list`, {method: 'GET'});
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    searchList = async (listName = '') => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list?limit=1&offset=0&search=${encodeURI(listName)}`, {method: 'GET'});
            return response;
        }
        catch(err) {
            if (err) throw err;
        };
        
    }

    getListPersons = async (id) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list/${id}/persons?limit=1&offset=0&order_by=id_desc`, {method: 'GET'});
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    createList = async (listName, options = { priority: 10, match_threshold: 0.8, notes: ''}) => {
        try {
            let defaultOptions = {
                name: listName,
                priority: 10, 
                match_threshold: 0.8, 
                notes: ''
            }
            let _options = Object.assign(defaultOptions, options);
            console.log(_options);

            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list?operator=SampleOp`, {
                method: 'POST',
                body: JSON.stringify(_options)
            });
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    deleteList = async (id) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list/${id}?operator=SampleOp`, {method: 'DELETE'});
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    searchPerson = async (list, personName) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list/${list}/persons?limit=100&offset=0&search=${encodeURI(personName)}`);
            return response;
        }
        catch(err) {if (err) throw err};
    }

    getDetection = async (id) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/archive/detection/${id}`, {method: 'GET'})
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    getDetectionImage = async (id) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/archive/detection/${id}/image`, {method: 'GET'})
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    getAnnotatedImage = async (id) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/archive/detection/${id}/annotated_image`, {
                method: 'GET',
            });
            let responseBuffers = [...(await response.buffer()).toString('hex').split('ffd8')[1].split('ffd9')];
            let boundary = (await response.headers.get('content-type')).split('boundary=')[1].replace(/"/g,'');
            let image = 'ffd8' + responseBuffers[0] + 'ffd9';
            let bbox = JSON.parse(Buffer.from(responseBuffers[1], 'hex').toString('utf-8').split(boundary)[1].replace(/(?:\\[rn]|[\r\n]+)+/g, '').split(`"data"`)[1].replace(/-/g,''));
            let result = {
                image: Buffer.from(image, 'hex'),
                bbox: bbox
            }
            return result;
        }
        catch(err) {if (err) throw err};
        
    }

    addPerson = async (personId, listId) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/list/${listId}?action=include_person&operator=SampleOp`, {
                method: 'POST',
                body: JSON.stringify({person_id: personId})
            })
            return response;
        }
        catch(err) {if (err) throw err};
        
    }

    createPerson = async (options = {first_name: '', middle_name: '', last_name: '', notes: '', list_id: 0}) => {
        try {
            if (!options?.list_id) return console.log('List id needed');
            if (!options?.last_name) return console.log('Last person id needed');

            let data = {
                first_name: options?.first_name == undefined ? "Suspect" : `${options.first_name}`,
                middle_name: options?.middle_name == undefined ? "" : `${options.middle_name}`,
                last_name: options?.last_name == undefined ? "" : `${options.last_name}`,
                notes: JSON.stringify({modified: Date.now().toString()}),
                list_id: options?.list_id == undefined ? 0 : options.list_id
            };

            console.log(data);
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/person?action=create&operator=SampleOp`, {
                method: 'POST',
                body: JSON.stringify(data)
            })
            return response;
        }
        catch(err) {if (err) throw err};
        
    }
    
    addPhotoFromFile = async (id, stream) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/person/${id}?action=add_from_image&operator=SampleOp`, {
                method: 'POST',
                body: stream,
                headers: {
                    'Content-Type': 'image/jpeg'}
            })
            return response;
        }
        catch(err) {if (err) throw err};
        
    }
    
    deletePerson = async (id) => {
        try {
            const response = await fetch(`http://${this.ip}:${this.port}/v1/spotter/person/${id}?operator=SampleOp`, {method: 'DELETE'});
            return response;
        }
        catch(err) {if (err) throw err};
    }
}


module.exports = {
    facexAPI: facexAPI
}