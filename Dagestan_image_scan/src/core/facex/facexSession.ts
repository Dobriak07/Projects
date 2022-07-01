import path from 'path';
import { CliBar } from '../cli/progress.bar';
import { exifReader } from '../exif/exif.service';
import { gmConvert } from '../imageconverter/convert_service';
import { LoggerService } from '../logger/class.logger';
import { Conf, FaceFindPerson, FacePerson } from '../types/myTypes';
import { FaceX } from './facexapi';

export async function uploadSession(conf: Conf, files: string[], logger: LoggerService) {
    try {
        let sessionStatus = 0;
        let uploadedFilesInfo = new Map();
        let axios = new FaceX(conf.ip, conf.port);

        let startSession = await axios.startSession();
        
        let sessionId = startSession.data.id;
        if (startSession.status != 201) {
            throw new Error(`Проблема создания сессии FaceX: ${startSession.status}: ${startSession.statusText}`);
        };
        logger.debug(`Создание сессии FaceX: ${startSession.status}: ${startSession.statusText}`);

        let progressBar = new CliBar('Uploading');
        progressBar.start(files.length, 0, { file: 'N/A'});
        let j = 1;
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
        progressBar.stop();
        logger.info(`Файл(ов) загружено в FaceX: ${uploadedFilesInfo.size}`);
        
        let startProcess = await axios.startProcess(sessionId);
        if (startProcess.status != 202) {
            throw new Error(`Проблема запуска сессии FaceX: ${startProcess.status}: ${startProcess.statusText}`);
        }
        logger.debug(`Запуск сессии FaceX: ${startProcess.status}: ${startProcess.statusText}`);

        let checkStatus = await axios.getSessionStatus(sessionId);
        if (checkStatus?.status == 200 && checkStatus.data.state == 'completed') {
            let sessionArr = [];
            for (let item of checkStatus.data.items) {
                let status = await axios.getItemStatus(item.id);
                sessionArr.push(status.data);
            }
            logger.debug('FaceX статус обработанных файлов:', sessionArr);
            
            let listId: string;
            let getList = await axios.getLists(conf.list_name);
            if (getList.status != 200) {
                throw new Error(`${getList.status}: ${getList.statusText}`);
            };
            logger.debug(`Поиск контрольного списка FaceX: ${getList.status}: ${getList.statusText}`);
            if (getList.data.lists.length == 0) {
                getList = await axios.createList(conf.list_name);
                if (getList.status != 201) {
                    throw new Error(`${getList.status}: ${getList.statusText}`);
                }
                logger.debug(`Создание контрольного списка FaceX: ${getList.status}: ${getList.statusText}`);
                listId = getList.data.id;
            }
            else {
                listId = getList.data.lists[0].id;
            };
            // console.log('ListID:', listId);
            
            let addedFiles = new Map<string, object>();
            let progressBar = new CliBar('Add person');
            progressBar.start(sessionArr.length, 0);
            let k = 1;
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
                        logger.debug(`Создание контрольного списка FaceX: ${getPerson.status}: ${getPerson.statusText}`);
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
            let deleteSession = await axios.deleteSession(sessionId);
            if (deleteSession.status != 200) {
                throw new Error(`Проблема удаления сессии FaceX: ${deleteSession.status}: ${deleteSession.statusText}`);
            }
            logger.debug(`Сессия FaceX удалена успешно: ${startProcess.status}: ${startProcess.statusText}`);
            return addedFiles;
        }
        return false
    }
    catch (err) {
        if (err) throw err;
    }
}