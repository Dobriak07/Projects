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
const progress_bar_1 = require("../cli/progress.bar");
const exif_service_1 = require("../exif/exif.service");
const convert_service_1 = require("../imageconverter/convert_service");
const facexapi_1 = require("./facexapi");
const promise_pool_1 = require("@supercharge/promise-pool");
function uploadSession(conf, files, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let uploadedFilesInfo = new Map();
            let axios = new facexapi_1.FaceX(conf.ip, conf.port);
            let startSession = yield axios.startSession();
            let sessionId = startSession.data.id;
            if (startSession.status != 201) {
                throw new Error(`Проблема создания сессии FaceX: ${startSession.status}: ${startSession.statusText}`);
            }
            ;
            logger.debug(`Создание сессии FaceX: ${startSession.status}: ${startSession.statusText}`);
            console.time('Uploading');
            let progressBar = new progress_bar_1.CliBar('Uploading');
            progressBar.start(files.length, 0);
            let j = 1;
            /* Пакетная загрузка */
            const { results, errors } = yield promise_pool_1.PromisePool.
                withConcurrency(5).
                for(files).
                process((file) => __awaiter(this, void 0, void 0, function* () {
                let extension = yield path_1.default.extname(file);
                if (extension == '.jpg' || extension == '.jpeg') {
                    let { exifInfo, imageBuf } = yield (0, exif_service_1.exifReader)(file);
                    let uploadJob = yield axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        logger.error(`Проблема загрузки фото в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                    }
                    ;
                    uploadedFilesInfo.set(path_1.default.basename(file), Object.assign({ path: path_1.default.dirname(file), file: path_1.default.basename(file) }, exifInfo));
                    // logger.info(`Файл загружен в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                }
                else {
                    let { exifInfo, imageBuf } = yield (0, exif_service_1.exifReader)(file);
                    imageBuf = yield (0, convert_service_1.gmConvert)(imageBuf);
                    let uploadJob = yield axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        logger.error(`Проблема загрузки фото в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                    }
                    ;
                    uploadedFilesInfo.set(path_1.default.basename(file), Object.assign({ path: path_1.default.dirname(file), file: path_1.default.basename(file) }, exifInfo));
                    // logger.info(`Файл загружен в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                }
                ;
                j++;
                progressBar.update(j);
            }));
            // console.log(results);
            // console.log(errors);
            if (errors.length != 0) {
                console.clear();
                for (const error of errors) {
                    logger.error(`Ошибка загрузки фото: ${error.item}. Текст ошибки: ${error.message}`);
                }
            }
            ;
            /* Пакетная загрузка */
            /* Последовательная загрузка
            for (let file of files) {
                // logger.info(`Sending file to FaceX, path: ${file}`);
                let extension = await path.extname(file);
                if(extension == '.jpg' || extension == '.jpeg') {
                    let { exifInfo, imageBuf } = await exifReader(file);
                    let uploadJob = await axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        logger.error(`Проблема загрузки фото в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                    };
                    uploadedFilesInfo.set(path.basename(file), {path: path.dirname(file), file: path.basename(file), ...exifInfo});
                    // logger.info(`Файл загружен в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                } else {
                    let { exifInfo, imageBuf } = await exifReader(file);
                    imageBuf = await gmConvert(imageBuf);
                    let uploadJob = await axios.addImage(sessionId, file, imageBuf);
                    if (uploadJob.status != 201) {
                        logger.error(`Проблема загрузки фото в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                    };
                    uploadedFilesInfo.set(path.basename(file), {path: path.dirname(file), file: path.basename(file), ...exifInfo});
                    // logger.info(`Файл загружен в FaceX: ${uploadJob.status}: ${uploadJob.statusText}`);
                };
                j++;
                progressBar.update(j);
            };
            */
            progressBar.stop();
            logger.info(`Файл(ов) загружено в FaceX: ${uploadedFilesInfo.size}`);
            console.timeEnd('Uploading');
            let startProcess = yield axios.startProcess(sessionId);
            if (startProcess.status != 202) {
                throw new Error(`Проблема запуска сессии FaceX: ${startProcess.status}: ${startProcess.statusText}`);
            }
            logger.debug(`Запуск сессии FaceX: ${startProcess.status}: ${startProcess.statusText}`);
            let checkStatus = yield axios.getSessionStatus(sessionId);
            if ((checkStatus === null || checkStatus === void 0 ? void 0 : checkStatus.status) == 200 && checkStatus.data.state == 'completed') {
                let sessionArr = [];
                for (let item of checkStatus.data.items) {
                    let status = yield axios.getItemStatus(item.id);
                    sessionArr.push(status.data);
                }
                logger.debug('FaceX статус обработанных файлов:', sessionArr);
                let listId;
                let getList = yield axios.getLists(conf.list_name);
                if (getList.status != 200) {
                    yield axios.deleteSession(sessionId);
                    throw new Error(`${getList.status}: ${getList.statusText}`);
                }
                ;
                logger.debug(`Поиск контрольного списка FaceX: ${getList.status}: ${getList.statusText}`);
                if (getList.data.lists.length == 0) {
                    getList = yield axios.createList(conf.list_name);
                    if (getList.status != 201) {
                        yield axios.deleteSession(sessionId);
                        throw new Error(`${getList.status}: ${getList.statusText}`);
                    }
                    logger.debug(`Создание контрольного списка FaceX: ${getList.status}: ${getList.statusText}`);
                    listId = getList.data.id;
                }
                else {
                    listId = getList.data.lists[0].id;
                }
                ;
                // console.log('ListID:', listId);
                console.time('Person Creating');
                let addedFiles = new Map();
                let progressBar = new progress_bar_1.CliBar('Add person');
                progressBar.start(sessionArr.length, 0);
                let k = 1;
                /* Пакетное добавление персон с фото */
                const { results, errors } = yield promise_pool_1.PromisePool.
                    withConcurrency(8).
                    for(sessionArr).
                    process((res) => __awaiter(this, void 0, void 0, function* () {
                    let state = 0;
                    let notes = uploadedFilesInfo.get(res.source);
                    let i = 1;
                    if (res.faces.length == 0) {
                        addedFiles.set(res.source, Object.assign({ code: 1, status: 'no_face' }, uploadedFilesInfo.get(res.source)));
                    }
                    else {
                        let findPerson = { first_name: notes.file, middle_name: notes.path };
                        let getPerson = yield axios.findPerson(+listId, findPerson);
                        if (getPerson.status != 200) {
                            throw new Error(`Поиск существующей персоны FaceX неудача: ${getPerson.status}: ${getPerson.statusText}`);
                        }
                        else if (getPerson.status == 200) {
                            logger.debug(`Создание персоны FaceX: ${getPerson.status}: ${getPerson.statusText}`);
                            for (let person of getPerson.data.persons) {
                                let deleteP = yield axios.deletePerson(person.id);
                                if (deleteP.status != 200) {
                                    throw new Error(`Ошибка удаления персоны FaceX: ${deleteP.status}: ${deleteP.statusText}`);
                                }
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
                                    throw new Error(`Проблема создания персоны FaceX: ${createP.status}: ${createP.statusText}`);
                                }
                                logger.debug(`Создание контрольного списка FaceX: ${createP.status}: ${createP.statusText}`);
                                let addPImage = yield axios.addPersonImage(createP.data.id, {
                                    "face_id": face.face_image.id
                                });
                                if (addPImage.status != 201) {
                                    yield axios.deletePerson(createP.data.id);
                                    throw new Error(`Проблема добавления фото персоне FaceX: ${addPImage.status}: ${addPImage.statusText}`);
                                }
                                logger.debug(`Фото добавлено персоне FaceX: ${addPImage.status}: ${addPImage.statusText}`);
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
                    progressBar.update(k);
                    k++;
                }));
                // console.log(errors);
                if (errors.length != 0) {
                    console.clear();
                    for (const error of errors) {
                        logger.error(`Ошибка добавления персоны: ${error.item.source}. Текст ошибки: ${error.message}`);
                    }
                }
                /* Пакетное добавление персон с фото */
                /* Последовательное добавление персон с фото
                for (let res of sessionArr) {
                    let state = 0;
                    let notes = uploadedFilesInfo.get(res.source);
                    let i = 1;
                    if (res.faces.length == 0) {
                        addedFiles.set(res.source, {code: 1, status: 'no_face', ...uploadedFilesInfo.get(res.source)});
                    } else {
                        let findPerson: FaceFindPerson = {first_name: notes.file, middle_name: notes.path};
                        let getPerson = await axios.findPerson(+listId, findPerson);
                        if (getPerson.status != 200) {
                            throw new Error(`Поиск существующей персоны FaceX неудача: ${getPerson.status}: ${getPerson.statusText}`);
                        }
                        else if (getPerson.status == 200) {
                            logger.debug(`Создание персоны FaceX: ${getPerson.status}: ${getPerson.statusText}`);
                            for (let person of getPerson.data.persons) {
                                let deleteP = await axios.deletePerson(person.id);
                                if (deleteP.status != 200) {
                                    throw new Error(`Ошибка удаления персоны FaceX: ${deleteP.status}: ${deleteP.statusText}`);
                                }
                            }
                        }
                        for (let face of res.faces) {
                            if (face.passed_filters) {
                                let person: FacePerson = {
                                    "first_name": `${notes.path}`,
                                    "middle_name": `${notes.file}_${i}`,
                                    "list_id": Number(listId),
                                    "notes": JSON.stringify(notes)
                                }
                                let createP = await axios.createPerson(person);
                                if (createP.status != 201) {
                                    throw new Error(`Проблема создания персоны FaceX: ${createP.status}: ${createP.statusText}`);
                                }
                                logger.debug(`Создание контрольного списка FaceX: ${createP.status}: ${createP.statusText}`);
                                let addPImage = await axios.addPersonImage(createP.data.id, {
                                    "face_id": face.face_image.id
                                });
                                if (addPImage.status != 201) {
                                    await axios.deletePerson(createP.data.id);
                                    throw new Error(`Проблема добавления фото персоне FaceX: ${addPImage.status}: ${addPImage.statusText}`);
                                }
                                logger.debug(`Фото добавлено персоне FaceX: ${addPImage.status}: ${addPImage.statusText}`);
                                state = 1;
                                i++;
                            }
                        }
                        if (state == 1) {
                            addedFiles.set(res.source, {code: 1, status: 'success', ...uploadedFilesInfo.get(res.source)});
                        } else {
                            addedFiles.set(res.source, {code: 0, status: 'upload_problem', ...uploadedFilesInfo.get(res.source)});
                        }
                    }
                    progressBar.update(k);
                    k++;
                }
                */
                console.timeEnd('Person Creating');
                let deleteSession = yield axios.deleteSession(sessionId);
                if (deleteSession.status != 200) {
                    throw new Error(`Проблема удаления сессии FaceX: ${deleteSession.status}: ${deleteSession.statusText}`);
                }
                logger.debug(`Сессия FaceX удалена успешно: ${startProcess.status}: ${startProcess.statusText}`);
                return addedFiles;
            }
            yield axios.deleteSession(sessionId);
            return false;
        }
        catch (err) {
            if (err)
                throw err;
        }
    });
}
exports.uploadSession = uploadSession;
