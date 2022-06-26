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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabloBuilder = void 0;
const iconv = __importStar(require("iconv-lite"));
const pauseEffects = {
    'p0': 'af',
    'p1': 'a1',
    'p2': 'a2',
    'p3': 'a3',
    'p4': 'a4',
    'p5': 'a5',
    'bl': '4b',
    'bi': '4c' // <BI> - инверсное мигание
};
const speedEffects = {
    'v1': 'b1',
    'v2': 'b2',
    'v3': 'b3',
    'v4': 'b4',
    'v5': 'b5',
    'v6': 'b6',
    'v7': 'b7',
    'v8': 'b8'
};
const visualEffects = {
    'd0': '68',
    'd1': '69',
    'd2': '6a',
    'd3': '6b',
    'd4': '6c',
    'd5': '6d',
    'd6': '6e',
    'd7': '6f',
    'd8': '70',
    'd9': '71',
    'd10': '72',
    'd11': '73',
    'd12': '74',
    'd13': '75',
    'd14': '76',
    'd15': '77',
    'd16': '78',
    'd17': '79',
    'd18': '7a',
    'd19': '7b',
    'd20': '7c',
    'd21': '7d' // <d21> - Движение слева направо с паузами
};
const centerText = {
    c0: '60',
    c1: '61' //<C1> - Включает автоматическую центровку текста.
};
class TabloBuilder {
    constructor() {
        this.bufArr = [];
        this.startByte = Buffer.from('1021', 'hex');
        this.endByte = Buffer.from('10FE', 'hex');
        this.bufArr.push(this.startByte);
    }
    ;
    setString(string) {
        if (string === undefined) {
            console.log('Не передано значение');
            return this;
        }
        let _string = string.toString();
        if (_string === '') {
            console.log('Передано пустое значение строки');
            return this;
        }
        this.bufArr.push(iconv.encode(_string, 'cp866'));
        return this;
    }
    ;
    setPause(pause) {
        if (pause === undefined) {
            console.log('Не передано значение');
            return this;
        }
        let _pause = pause.toString().toLowerCase();
        if (_pause === '') {
            console.log('Передано пустое значение паузы');
            return this;
        }
        if (!Object.keys(pauseEffects).includes(_pause)) {
            console.log('Передано неверное значение паузы');
            return this;
        }
        this.bufArr.push(Buffer.from(`ff${pauseEffects[_pause]}`, 'hex'));
        return this;
    }
    ;
    setSpeed(speed) {
        if (speed === undefined) {
            console.log('Не передано значение');
            return this;
        }
        let _speed = speed.toString().toLowerCase();
        if (_speed === '') {
            console.log('Передано пустое значение скорости');
            return this;
        }
        if (!Object.keys(speedEffects).includes(_speed)) {
            console.log('Передано неверное значение скорости');
            return this;
        }
        this.bufArr.push(Buffer.from(`ff${speedEffects[_speed]}`, 'hex'));
        return this;
    }
    ;
    setEffect(effect) {
        if (effect === undefined) {
            console.log('Не передано значение');
            return this;
        }
        let _effect = effect.toString().toLowerCase();
        if (_effect === '') {
            console.log('Передано пустое значение эффекта появления');
            return this;
        }
        if (!Object.keys(visualEffects).includes(_effect)) {
            console.log('Передано неверное значение эффекта появления');
            return this;
        }
        this.bufArr.push(Buffer.from(`ff${visualEffects[_effect]}`, 'hex'));
        return this;
    }
    ;
    setCenter(center) {
        if (center === undefined) {
            console.log('Не передано значение');
            return this;
        }
        let _center = center.toString().toLowerCase();
        if (_center === '') {
            console.log('Передано пустое значение эффекта появления');
            return this;
        }
        if (!Object.keys(centerText).includes(_center)) {
            console.log('Передано неверное значение эффекта появления');
            return this;
        }
        this.bufArr.push(Buffer.from(`ff${centerText[_center]}`, 'hex'));
        return this;
    }
    ;
    finalize() {
        this.bufArr.push(this.endByte);
        return Buffer.concat(this.bufArr);
    }
}
exports.TabloBuilder = TabloBuilder;
