"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliBar = void 0;
const Bar = __importStar(require("cli-progress"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
class CliBar {
    constructor(name) {
        switch (name) {
            case 'Uploading':
                this.bar = new Bar.SingleBar({
                    format: name + '  | ' + ansi_colors_1.default.green('{bar}') + ' | {percentage}% || {value}/{total} file(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                });
                break;
            case 'Processing':
                this.bar = new Bar.SingleBar({
                    format: name + ' | ' + ansi_colors_1.default.yellow('{bar}') + ' | {percentage}% || {value}/{total} item(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                });
                break;
            case 'Add person':
                this.bar = new Bar.SingleBar({
                    format: name + ' | ' + ansi_colors_1.default.blue('{bar}') + ' | {percentage}% || {value}/{total} item(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                });
                break;
        }
    }
    start(totalValue, startValue = 0, payload) {
        this.bar.start(totalValue, startValue, payload);
    }
    increment(step, payload) {
        this.bar.increment(step, payload);
    }
    update(value, payload) {
        this.bar.update(value, payload);
    }
    stop() {
        this.bar.stop();
    }
    setTotal(total) {
        this.bar.setTotal(total);
    }
}
exports.CliBar = CliBar;
