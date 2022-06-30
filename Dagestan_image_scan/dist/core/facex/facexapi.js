"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSession = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const node_path_1 = __importDefault(require("node:path"));
const console_log_service_1 = require("../console/console.log.service");
const exif_service_1 = require("../exif/exif.service");
const convert_service_1 = require("../imageconverter/convert_service");
const delay = (ms) => __awaiter(void 0, void 0, void 0, function* () { return yield new Promise(resolve => setTimeout(resolve, ms)); });
class AxiosCustom {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.axios = axios_1.default.create({
            baseURL: `http://${this.ip}:${this.port}/`,
            timeout: 10000,
        });
    }
    ;
    getLists(listName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.get(`/v1/spotter/list?limit=1&offset=0&search=${encodeURI(listName)}`);
        });
    }
    createList(listName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.post(`/v1/spotter/list?operator=SampleOp`, {
                "name": `${listName}`,
                "priority": 1,
                "match_threshold": 0.7,
                "notes": ""
            });
        });
    }
    ;
    createPerson(person) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.post(`/v1/spotter/person?action=create&operator=SampleOp`, person);
        });
    }
    ;
    addPersonImage(id, imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.post(`/v1/spotter/person/${id}?action=add_face&operator=SampleOp`, imageId);
        });
    }
    startSession() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.post('/v1/spotter/import/session');
        });
    }
    ;
    addImage(sessionId, filePath, buff) {
        return __awaiter(this, void 0, void 0, function* () {
            let form = new form_data_1.default();
            form.append('data', JSON.stringify({
                "source": `${node_path_1.default.basename(filePath)}`,
                "first_name": `${node_path_1.default.basename(filePath)}`,
                "middle_name": '',
                "last_name": ''
            }), { contentType: 'application/json' });
            form.append('image', buff, { contentType: 'image/jpeg' });
            return yield this.axios.post(`/v1/spotter/import/session/${sessionId}?action=add_image`, form);
        });
    }
    startProcess(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.post(`/v1/spotter/import/session/${sessionId}?action=process`);
        });
    }
    getSessionStatus(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            let status = 'null';
            let response;
            while (status != 'completed') {
                response = yield this.axios.get(`/v1/spotter/import/session/${sessionId}`);
                if (response.status == 200) {
                    status = response.data.state;
                    yield delay(1000);
                }
            }
            return response;
        });
    }
    getItemStatus(itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.get(`/v1/spotter/import/item/${itemId}`);
        });
    }
}
;
function uploadSession(conf, files) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let uploadedFilesInfo = new Map();
            let _axios = new AxiosCustom(conf.ip, conf.port);
            let startSession = yield _axios.startSession();
            let sessionId = startSession.data.id;
            if (startSession.status != 201) {
                return `${startSession.status}: ${startSession.statusText}`;
            }
            ;
            for (let file of files) {
                (0, console_log_service_1.printMessage)(`Sending file to FaceX, path: ${file}`);
                let extension = yield node_path_1.default.extname(file);
                if (extension == '.jpg' || extension == '.jpeg') {
                    let { exifInfo, imageBuf } = yield (0, exif_service_1.exifReader)(file);
                    let uploadJob = yield _axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                    }
                    ;
                    uploadedFilesInfo.set(node_path_1.default.basename(file), Object.assign({ path: node_path_1.default.dirname(file), file: node_path_1.default.basename(file) }, exifInfo));
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                }
                else {
                    let { exifInfo, imageBuf } = yield (0, exif_service_1.exifReader)(file);
                    imageBuf = yield (0, convert_service_1.gmConvert)(imageBuf);
                    let uploadJob = yield _axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                    }
                    ;
                    uploadedFilesInfo.set(node_path_1.default.basename(file), Object.assign({ path: node_path_1.default.dirname(file), file: node_path_1.default.basename(file) }, exifInfo));
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                }
                ;
            }
            ;
            let startProcess = yield _axios.startProcess(sessionId);
            if (startProcess.status != 202) {
                return `${startProcess.status}: ${startProcess.statusText}`;
            }
            let checkStatus = yield _axios.getSessionStatus(sessionId);
            if ((checkStatus === null || checkStatus === void 0 ? void 0 : checkStatus.status) == 200 && checkStatus.data.state == 'completed') {
                // console.log(uploadedFilesInfo);
                let sessionArr = [];
                for (let item of checkStatus.data.items) {
                    let status = yield _axios.getItemStatus(item.id);
                    // console.log(status.status, status.data);
                    if (status.data.faces.length != 0) {
                        sessionArr.push(status.data);
                    }
                }
                let listId;
                let getList = yield _axios.getLists(conf.list_name);
                // console.log(getList.data);
                if (getList.status != 200) {
                    return `${getList.status}: ${getList.statusText}`;
                }
                ;
                if (getList.data.lists.length == 0) {
                    getList = yield _axios.createList(conf.list_name);
                    if (getList.status != 201) {
                        return `${getList.status}: ${getList.statusText}`;
                    }
                    listId = getList.data.id;
                }
                else {
                    listId = getList.data.lists[0].id;
                }
                ;
                console.log('ListID:', listId);
                for (let res of sessionArr) {
                    let notes = uploadedFilesInfo.get(res.source);
                    let i = 1;
                    for (let face of res.faces) {
                        // console.log(face);
                        if (face.passed_filters) {
                            let person = {
                                "first_name": `${notes.file}_${i}`,
                                "list_id": Number(listId),
                                "notes": JSON.stringify(notes)
                            };
                            let createP = yield _axios.createPerson(person);
                            if (createP.status != 201) {
                                console.log(`${createP.status}: ${createP.statusText}`);
                            }
                            // console.log('Person', createP.data.id);
                            // console.log(face.face_image.id);
                            let addPImage = yield _axios.addPersonImage(createP.data.id, {
                                "face_id": face.face_image.id
                            });
                            if (addPImage.status != 201) {
                                console.log(`${addPImage.status}: ${addPImage.statusText}`);
                            }
                            console.log(`${addPImage.status}: ${addPImage.statusText}`);
                            i++;
                        }
                    }
                }
            }
        }
        catch (err) {
            if (err)
                console.log(err);
        }
    });
}
exports.uploadSession = uploadSession;
