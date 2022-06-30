import path from 'path';
import { printMessage } from '../console/console.log.service';
import { exifReader } from '../exif/exif.service';
import { gmConvert } from '../imageconverter/convert_service';
import { Conf, FaceFindPerson, FacePerson } from '../types/myTypes';
import { FaceX } from './facexapi';

export async function uploadSession(conf: Conf, files: string[]) {
    try {
        let uploadedFilesInfo = new Map();
        let axios = new FaceX(conf.ip, conf.port);

        let startSession = await axios.startSession();
        
        let sessionId = startSession.data.id;
        if (startSession.status != 201) {
            return `${startSession.status}: ${startSession.statusText}`
        };

        for (let file of files) {
            printMessage(`Sending file to FaceX, path: ${file}`);
            let extension = await path.extname(file);
            if(extension == '.jpg' || extension == '.jpeg') {
                let { exifInfo, imageBuf } = await exifReader(file);
                let uploadJob = await axios.addImage(sessionId, file, imageBuf);
                if (uploadJob.status != 201) {
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                };
                uploadedFilesInfo.set(path.basename(file), {path: path.dirname(file), file: path.basename(file), ...exifInfo});
                console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
            } else {
                let { exifInfo, imageBuf } = await exifReader(file);
                imageBuf = await gmConvert(imageBuf);
                let uploadJob = await axios.addImage(sessionId, file, imageBuf);
                if (uploadJob.status != 201) {
                    console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
                };
                uploadedFilesInfo.set(path.basename(file), {path: path.dirname(file), file: path.basename(file), ...exifInfo});
                console.log(`${uploadJob.status}: ${uploadJob.statusText}`);
            };
        };
           
        let startProcess = await axios.startProcess(sessionId);
        if (startProcess.status != 202) {
            return `${startProcess.status}: ${startProcess.statusText}`
        }

        let checkStatus = await axios.getSessionStatus(sessionId);
        if (checkStatus?.status == 200 && checkStatus.data.state == 'completed') {
            // console.log(uploadedFilesInfo);
            let sessionArr = [];
            for (let item of checkStatus.data.items) {
                let status = await axios.getItemStatus(item.id);
                // console.log(status.status, status.data);
                sessionArr.push(status.data);
                if (status.data.faces.length != 0) {
                }
            }
            
            let listId: string;
            let getList = await axios.getLists(conf.list_name);
            // console.log(getList.data);
            if (getList.status != 200) {
                return `${getList.status}: ${getList.statusText}`
            };
            if (getList.data.lists.length == 0) {
                getList = await axios.createList(conf.list_name);
                if (getList.status != 201) {
                    return `${getList.status}: ${getList.statusText}`
                }
                listId = getList.data.id;
            }
            else {
                listId = getList.data.lists[0].id;
            };
            console.log('ListID:', listId);
            
            let addedFiles = new Map<string, object>();
            for (let res of sessionArr) {
                let state = 0;
                let notes = uploadedFilesInfo.get(res.source);
                let i = 1;
                if (res.faces.length == 0) {
                    addedFiles.set(res.source, {code: 1, status: 'no_face', ...uploadedFilesInfo.get(res.source)});
                } else {
                    let findPerson: FaceFindPerson = {first_name: notes.file, middle_name: notes.path};
                    let getPerson = await axios.findPerson(+listId, findPerson);
                    console.log(getPerson.data.persons);
                    if (getPerson.status != 200) {
                        console.log(`${getPerson.status}: ${getPerson.statusText}`)
                    } 
                    else if (getPerson.status == 200) {
                        for (let person of getPerson.data.persons) {
                            await axios.deletePerson(person.id);
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
                                console.log(`${createP.status}: ${createP.statusText}`);
                            }
                            let addPImage = await axios.addPersonImage(createP.data.id, {
                                "face_id": face.face_image.id
                            });
                            if (addPImage.status != 201) {
                                console.log(`${addPImage.status}: ${addPImage.statusText}`);
                                await axios.deletePerson(createP.data.id);
                            }
                            console.log(`${addPImage.status}: ${addPImage.statusText}`);
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
            }
            return addedFiles;
        }
        return false
    }
    catch (err) {
        if (err) console.log(err);
    }
}