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
const path_1 = __importDefault(require("path"));
const console_log_service_1 = require("../console/console.log.service");
const exif_service_1 = require("../exif/exif.service");
const convert_service_1 = require("../imageconverter/convert_service");
const facexapi_1 = require("./facexapi");
function uploadSession(conf, files) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let uploadedFilesInfo = new Map();
            let axios = new facexapi_1.FaceX(conf.ip, conf.port);
            let startSession = yield axios.startSession();
            let sessionId = startSession.data.id;
            if (startSession.status != 201) {
                return `${startSession.status}: ${startSession.statusText}`;
            }
            ;
            for (let file of files) {
                (0, console_log_service_1.printMessage)(`Sending file to FaceX, path: ${file}`);
                let extension = yield path_1.default.extname(file);
                if (extension == '.jpg' || extension == '.jpeg') {
                    let { exifInfo, imageBuf } = yield (0, exif_service_1.exifReader)(file);
                    let uploadJob = yield axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                    }
                    ;
                    uploadedFilesInfo.set(path_1.default.basename(file), Object.assign({ path: path_1.default.dirname(file), file: path_1.default.basename(file) }, exifInfo));
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                }
                else {
                    let { exifInfo, imageBuf } = yield (0, exif_service_1.exifReader)(file);
                    imageBuf = yield (0, convert_service_1.gmConvert)(imageBuf);
                    let uploadJob = yield axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                    }
                    ;
                    uploadedFilesInfo.set(path_1.default.basename(file), Object.assign({ path: path_1.default.dirname(file), file: path_1.default.basename(file) }, exifInfo));
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                }
                ;
            }
            ;
            let startProcess = yield axios.startProcess(sessionId);
            if (startProcess.status != 202) {
                return `${startProcess.status}: ${startProcess.statusText}`;
            }
            let checkStatus = yield axios.getSessionStatus(sessionId);
            if ((checkStatus === null || checkStatus === void 0 ? void 0 : checkStatus.status) == 200 && checkStatus.data.state == 'completed') {
                // console.log(uploadedFilesInfo);
                let sessionArr = [];
                for (let item of checkStatus.data.items) {
                    let status = yield axios.getItemStatus(item.id);
                    // console.log(status.status, status.data);
                    sessionArr.push(status.data);
                    if (status.data.faces.length != 0) {
                    }
                }
                let listId;
                let getList = yield axios.getLists(conf.list_name);
                // console.log(getList.data);
                if (getList.status != 200) {
                    return `${getList.status}: ${getList.statusText}`;
                }
                ;
                if (getList.data.lists.length == 0) {
                    getList = yield axios.createList(conf.list_name);
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
                let addedFiles = new Map();
                for (let res of sessionArr) {
                    let state = 0;
                    let notes = uploadedFilesInfo.get(res.source);
                    let i = 1;
                    if (res.faces.length == 0) {
                        addedFiles.set(res.source, Object.assign({ code: 1, status: 'no_face' }, uploadedFilesInfo.get(res.source)));
                    }
                    else {
                        let findPerson = { first_name: notes.file, middle_name: notes.path };
                        let getPerson = yield axios.findPerson(+listId, findPerson);
                        console.log(getPerson.data.persons);
                        if (getPerson.status != 200) {
                            console.log(`${getPerson.status}: ${getPerson.statusText}`);
                        }
                        else if (getPerson.status == 200) {
                            for (let person of getPerson.data.persons) {
                                yield axios.deletePerson(person.id);
                            }
                        }
                        for (let face of res.faces) {
                            if (face.passed_filters) {
                                let person = {
                                    "first_name": `${notes.path}`,
                                    "middle_name": `${notes.file}_${i}`,
                                    "list_id": Number(listId),
                                    "notes": JSON.stringify(notes)
                                };
                                let createP = yield axios.createPerson(person);
                                if (createP.status != 201) {
                                    console.log(`${createP.status}: ${createP.statusText}`);
                                }
                                let addPImage = yield axios.addPersonImage(createP.data.id, {
                                    "face_id": face.face_image.id
                                });
                                if (addPImage.status != 201) {
                                    console.log(`${addPImage.status}: ${addPImage.statusText}`);
                                    yield axios.deletePerson(createP.data.id);
                                }
                                console.log(`${addPImage.status}: ${addPImage.statusText}`);
                                state = 1;
                                i++;
                            }
                        }
                        if (state == 1) {
                            addedFiles.set(res.source, Object.assign({ code: 1, status: 'success' }, uploadedFilesInfo.get(res.source)));
                        }
                        else {
                            addedFiles.set(res.source, Object.assign({ code: 0, status: 'upload_problem' }, uploadedFilesInfo.get(res.source)));
                        }
                    }
                }
                return addedFiles;
            }
            return false;
        }
        catch (err) {
            if (err)
                console.log(err);
        }
    });
}
exports.uploadSession = uploadSession;
