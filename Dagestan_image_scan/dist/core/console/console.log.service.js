"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printMessage = exports.printError = void 0;
const chalk_1 = __importDefault(require("chalk"));
const printError = (err) => {
    // console.clear();
    console.log(`${chalk_1.default.bgRed('ERROR:')} ${chalk_1.default.red(err)}`);
};
exports.printError = printError;
const printMessage = (msg) => {
    // console.clear();
    console.log(`${chalk_1.default.bgGrey('INFO:')} ${chalk_1.default.grey(msg)}`);
};
exports.printMessage = printMessage;
