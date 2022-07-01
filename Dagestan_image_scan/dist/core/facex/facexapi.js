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
exports.FaceX = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const node_path_1 = __importDefault(require("node:path"));
const progress_bar_1 = require("../cli/progress.bar");
const delay = (ms) => __awaiter(void 0, void 0, void 0, function* () { return yield new Promise(resolve => setTimeout(resolve, ms)); });
class FaceX {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.axios = axios_1.default.create({
            baseURL: `http://${this.ip}:${this.port}/`,
            // timeout: 10000,
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
    findPerson(listId, person) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.get(`/v1/spotter/list/${listId}/persons?limit=100&offset=0&search=${encodeURI(`${person.middle_name} ${person.first_name}`)}&order_by=id_desc`);
        });
    }
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
    deletePerson(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.delete(`/v1/spotter/person/${id}?operator=SampleOp`);
        });
    }
    startSession() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.post('/v1/spotter/import/session');
        });
    }
    ;
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.delete(`/v1/spotter/import/session/${sessionId}`);
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
            try {
                let progressBar = new progress_bar_1.CliBar('Processing');
                progressBar.start(0, 0);
                let status = 'null';
                let response;
                while (status != 'completed') {
                    response = yield this.axios.get(`/v1/spotter/import/session/${sessionId}`);
                    if (response.status == 200) {
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
                        yield delay(1000);
                    }
                }
                progressBar.stop();
                return response;
            }
            catch (err) {
                throw err;
            }
        });
    }
    getItemStatus(itemId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.axios.get(`/v1/spotter/import/item/${itemId}`);
        });
    }
}
exports.FaceX = FaceX;
;
