import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import path from 'node:path';
import { CliBar } from '../cli/progress.bar';
import { FaceFindPerson, FacePerson, ImageID } from '../types/myTypes';
const delay = async (ms: number) => await new Promise(resolve => setTimeout(resolve, ms));

export class FaceX {
    ip: string;
    port: string | number;
    axios: AxiosInstance;

    constructor(ip: string, port: string | number) {
        this.ip = ip;
        this.port = port;
        this.axios = axios.create({
            baseURL: `http://${this.ip}:${this.port}/`,
            // timeout: 10000,
        })
    };

    async getLists(listName: string) {
        return await this.axios.get(`/v1/spotter/list?limit=1&offset=0&search=${encodeURI(listName)}`);
    }

    async createList(listName: string) {
        return await this.axios.post(`/v1/spotter/list?operator=SampleOp`, {
            "name": `${listName}`,
            "priority": 1,
            "match_threshold": 0.7,
            "notes": ""
          }
        );
    };

    async findPerson(listId: number, person: FaceFindPerson) {
        return await this.axios.get(`/v1/spotter/list/${listId}/persons?limit=100&offset=0&search=${encodeURI(`${person.middle_name} ${person.first_name}`)}&order_by=id_desc`);
    }

    async createPerson(person: FacePerson) {
        return await this.axios.post(`/v1/spotter/person?action=create&operator=SampleOp`, person);
    };

    async addPersonImage(id: number,imageId: ImageID) {
        return await this.axios.post(`/v1/spotter/person/${id}?action=add_face&operator=SampleOp`, imageId);
    }

    async deletePerson(id: number) {
        return await this.axios.delete(`/v1/spotter/person/${id}?operator=SampleOp`);
    }

    async startSession() {
         return await this.axios.post('/v1/spotter/import/session');
    };

    async deleteSession(sessionId: string) {
        return await this.axios.delete(`/v1/spotter/import/session/${sessionId}`);
   };

    async addImage(sessionId: string, filePath: string, buff: Buffer) {
        let form = new FormData();
        form.append('data', JSON.stringify({
            "source": `${path.basename(filePath)}`,
            "first_name": `${path.basename(filePath)}`,
            "middle_name": '',
            "last_name": ''
            }), {contentType: 'application/json'});
        form.append('image', buff, {contentType: 'image/jpeg'});
        return await this.axios.post(`/v1/spotter/import/session/${sessionId}?action=add_image`, form);
    }

    async startProcess(sessionId: string) {
        return await this.axios.post(`/v1/spotter/import/session/${sessionId}?action=process`)
    }

    async getSessionStatus(sessionId: string) {
        try {
            let progressBar = new CliBar('Processing');
            progressBar.start(0, 0);
            let status = 'null';
            let response;
            while (status != 'completed') {
                response = await this.axios.get(`/v1/spotter/import/session/${sessionId}`);
                if(response.status == 200) {
                    let i = 0;
                    progressBar.setTotal(response.data.items.length);
                    // console.log(response.data);
                    for (const item of response.data.items) {
                        if (item.state == 'ok') {
                            i++;
                        }
                    }
                    status = response.data.state;
                    progressBar.update(i);
                    await delay(1000);
                }
                
            }
            progressBar.stop();
            return response;
        }
        catch(err) {
            throw err;
        }
    }

    async getItemStatus(itemId: string) {
        return await this.axios.get(`/v1/spotter/import/item/${itemId}`);
    } 
};