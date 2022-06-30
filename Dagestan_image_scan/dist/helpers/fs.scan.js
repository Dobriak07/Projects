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
exports.scanDir = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function scanDir(conf, dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const EXTENSIONS = conf.extensions;
        let result = { dirs: [], files: [] };
        try {
            let dir = yield fs_1.default.promises.readdir(path_1.default.normalize(dirPath));
            dir.forEach((el) => {
                if (fs_1.default.statSync(path_1.default.join(dirPath, el)).isDirectory()) {
                    result.dirs.push(path_1.default.join(dirPath, el).split(path_1.default.sep).join('/'));
                }
                else if (EXTENSIONS.includes(path_1.default.extname(el))) {
                    result.files.push(path_1.default.join(dirPath, el).split(path_1.default.sep).join('/'));
                }
            });
            return result;
        }
        catch (err) {
            if (err)
                throw err;
        }
    });
}
exports.scanDir = scanDir;
;
