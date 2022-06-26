"use strict";
/*
    heic - DateTime?.description
    jpg/jpeg - DateTime?.description
    png - DateCreated?.value
    tiff - ?
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exifReader = void 0;
const ExifReader = __importStar(require("exifreader"));
const promises_1 = require("node:fs/promises");
function exifReader(filePath) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let exifInfo = {
            date: '',
            latitude: '',
            longitude: ''
        };
        let imageBuf = yield (0, promises_1.readFile)(filePath);
        let metaData = ExifReader.load(imageBuf);
        exifInfo.date = ((_a = metaData.DateTime) === null || _a === void 0 ? void 0 : _a.description) ? metaData.DateTime.description :
            ((_b = metaData.DateCreated) === null || _b === void 0 ? void 0 : _b.value) ? metaData.DateCreated.value :
                (yield (0, promises_1.stat)(filePath)).birthtime.toISOString();
        exifInfo.latitude = metaData.GPSLatitude ? metaData.GPSLatitude.description : '';
        exifInfo.longitude = metaData.GPSLongitude ? metaData.GPSLongitude.description : '';
        return { exifInfo, imageBuf };
    });
}
exports.exifReader = exifReader;
