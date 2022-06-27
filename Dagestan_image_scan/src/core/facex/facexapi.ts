import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import path from 'node:path';
import { printMessage } from '../console/console.log.service';
import { exifReader } from '../exif/exif.service';
import { gmConvert } from '../imageconverter/convert_service';
import { Conf } from '../types/myTypes';
const delay = async (ms: number) => await new Promise(resolve => setTimeout(resolve, ms));

class AxiosCustom {
    ip: string;
    port: string | number;
    axios: AxiosInstance;

    constructor(ip: string, port: string | number) {
        this.ip = ip;
        this.port = port;
        this.axios = axios.create({
            baseURL: `http://${this.ip}:${this.port}/`,
            timeout: 10000,
        })
    };

    async getLists(listName: string) {
        return await this.axios.get(`/v1/spotter/list?limit=1&offset=0&search=${encodeURI(listName)}`)
    }

    async startSession() {
         return await this.axios.post('/v1/spotter/import/session');
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
        let status = 'null';
        let response;
        while (status != 'completed') {
            response = await this.axios.get(`/v1/spotter/import/session/${sessionId}`);
            if(response.status == 200) {
                status = response.data.state;
                await delay(1000);
            }
        }
        return response;
    }

    async getItemStatus(itemId: string) {
        return await this.axios.get(`/v1/spotter/import/item/${itemId}`);
    } 
};

export async function addImage(conf: Conf, files: string[]) {
    try {
        let uploadedFilesInfo = new Map();
        let _axios = new AxiosCustom(conf.ip, conf.port);
        let listName = await _axios.getLists(conf.list_name);
        if (listName.status != 200) {
            return `${listName.status}: ${listName.statusText}`
        };

        let startSession = await _axios.startSession();
        let sessionId = startSession.data.id;
        if (startSession.status != 201) {
            return `${startSession.status}: ${startSession.statusText}`
        };

        for (let file of files) {
            printMessage(`Sending file to FaceX, path: ${file}`);
            let extension = await path.extname(file);
            if(extension == '.jpg' || extension == '.jpeg') {
                let { exifInfo, imageBuf } = await exifReader(file);
                let uploadJob = await _axios.addImage(sessionId, file, imageBuf);
                if (uploadJob.status != 201) {
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                };
                uploadedFilesInfo.set(path.basename(file), exifInfo);
                console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
            } else {
                let { exifInfo, imageBuf } = await exifReader(file);
                imageBuf = await gmConvert(imageBuf);
                let uploadJob = await _axios.addImage(sessionId, file, imageBuf);
                if (uploadJob.status != 201) {
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                };
                uploadedFilesInfo.set(path.basename(file), exifInfo);
                console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
            };
        };
           
        let startProcess = await _axios.startProcess(sessionId);
        if (startProcess.status != 202) {
            return `${startProcess.status}: ${startProcess.statusText}`
        }

        let checkStatus = await _axios.getSessionStatus(sessionId);
        if (checkStatus?.status == 200 && checkStatus.data.state == 'completed') {
            console.log(uploadedFilesInfo);
            for (let item of checkStatus.data.items) {
                let status = await _axios.getItemStatus(item.id);
                console.log(status.status, status.data);
            }
        }
    }
    catch (err) {
        if (err) console.log(err);
    }
}