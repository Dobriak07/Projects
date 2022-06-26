import * as iconv from 'iconv-lite';

interface IEffects {
    [index: string]: string;
}

const pauseEffects: IEffects = {
    'p0': 'af', // <p0> - Отмена автопаузы – отменяет автоматическую паузу после эффектов появления.0xaf  - <P0>    
    'p1': 'a1', // <p1> - вставляет в сообщение паузу длительностью примерно 0,5 секунды.
    'p2': 'a2', // <p2> - вставляет в сообщение паузу длительностью примерно 1 секунда. -3-
    'p3': 'a3', // <p3> - вставляет в сообщение паузу длительностью примерно 3 секунды.
    'p4': 'a4', // <p4> - вставляет в сообщение паузу длительностью примерно 5 секунд.
    'p5': 'a5', // <p5> - вставляет в сообщение паузу длительностью примерно 10 секунд.
    'bl': '4b', // <BL> - однократное мигание
    'bi': '4c' // <BI> - инверсное мигание
}

const speedEffects: IEffects = {
    'v1': 'b1', // <v1> - устанавливает скорость движения информации  1 (максимальная скорость движения информации).   
    'v2': 'b2', // <v2> - устанавливает скорость движения информации  2.
    'v3': 'b3', // <v3> - устанавливает скорость движения информации  3.
    'v4': 'b4', // <v4> - устанавливает скорость движения информации  4.
    'v5': 'b5', // <v5> - устанавливает скорость движения информации  5.
    'v6': 'b6', // <v6> - устанавливает скорость движения информации  6  (самая медленная скорость).
    'v7': 'b7',
    'v8': 'b8'
}

const visualEffects: IEffects = {
    'd0': '68', // <d0> - Появление снизу с замещением предыдущего текста.
    'd1': '69', // <d1> - Появление снизу с замещением предыдущего текста.
    'd2': '6a', // <d2> - Появление сверху с замещением предыдущего текста.
    'd3': '6b', // <d3> - Появление снизу с выталкиванием предыдущего текста.
    'd4': '6c', // <d4> - Появление сверху с выталкиванием предыдущего текста.
    'd5': '6d', // <d5> - Плавное появление по точкам.
    'd6': '6e', // <d6> - Шторки к центру с замещением предыдущего текста.
    'd7': '6f', // <d7> - Шторки к центру с выталкиванием предыдущего текста.
    'd8': '70', // <d8> - Шторки от центра с замещением предыдущего текста.
    'd9': '71', // <d9> - Шторки от центра с выталкиванием предыдущего текста.
    'd10': '72', // <d10> - Шторки к центру
    'd11': '73', // <d11> - Шторки от центра
    'd12': '74', // <d12>  - Шторки горизонтальные к центру
    'd13': '75', // <d13> - Шторки горизонтальные от центра
    'd14': '76', // <d14> - Появление по буквам слева
    'd15': '77', // <d15> - Появление по буквам с вытягиванием
    'd16': '78', // <d16> - Появление по буквам  сверху 
    'd17': '79', // <d17> - Появление по буквам снизу
    'd18': '7a', // <d18> - Появление по буквам чередование 
    'd19': '7b', // <d19> - Появление по буквам печать
    'd20': '7c', // <d20> - Движение справа налево с паузами
    'd21': '7d' // <d21> - Движение слева направо с паузами
}

const centerText: IEffects = {
    c0: '60', //<C0> - Выключает автоматическую центровку текста.
    c1: '61' //<C1> - Включает автоматическую центровку текста.
}

export class TabloBuilder {
    private bufArr: any[] = [];
    private startByte: Buffer = Buffer.from('1021', 'hex');
    private endByte = Buffer.from('10FE', 'hex');

    constructor() {
        this.bufArr.push(this.startByte);
    };

    setString(string: string) {
        if(string === undefined) { 
            console.log('Не передано значение')
            return this;
        }

        let _string = string.toString();
        
        if(_string === '') {
            console.log('Передано пустое значение строки');
            return this;
        }

        this.bufArr.push(iconv.encode(_string, 'cp866'));
        return this;
    };

    setPause(pause: string) {
        if(pause === undefined) { 
            console.log('Не передано значение')
            return this;
        }

        let _pause: string = pause.toString().toLowerCase();
        if(_pause === '') {
            console.log('Передано пустое значение паузы');
            return this;
        }

        if(!Object.keys(pauseEffects).includes(_pause)) {
            console.log('Передано неверное значение паузы');
            return this;
        }

        this.bufArr.push(Buffer.from(`ff${pauseEffects[_pause]}`, 'hex'));
        return this;
    };

    setSpeed(speed: string) {
        if(speed === undefined) { 
            console.log('Не передано значение')
            return this;
        }

        let _speed: string = speed.toString().toLowerCase();
        if(_speed === '') {
            console.log('Передано пустое значение скорости');
            return this;
        }

        if(!Object.keys(speedEffects).includes(_speed)) {
            console.log('Передано неверное значение скорости');
            return this;
        }

        this.bufArr.push(Buffer.from(`ff${speedEffects[_speed]}`, 'hex'));
        return this;
    };

    setEffect(effect: string) {
        if(effect === undefined) { 
            console.log('Не передано значение')
            return this;
        }

        let _effect: string = effect.toString().toLowerCase();
        if(_effect === '') {
            console.log('Передано пустое значение эффекта появления');
            return this;
        }

        if(!Object.keys(visualEffects).includes(_effect)) {
            console.log('Передано неверное значение эффекта появления');
            return this;
        }

        this.bufArr.push(Buffer.from(`ff${visualEffects[_effect]}`, 'hex'));
        return this;
    };

    setCenter(center: string) {
        if(center === undefined) { 
            console.log('Не передано значение')
            return this;
        }

        let _center: string = center.toString().toLowerCase();
        if(_center === '') {
            console.log('Передано пустое значение эффекта появления');
            return this;
        }

        if(!Object.keys(centerText).includes(_center)) {
            console.log('Передано неверное значение эффекта появления');
            return this;
        }

        this.bufArr.push(Buffer.from(`ff${centerText[_center]}`, 'hex'));
        return this;
    };

    finalize() {
        this.bufArr.push(this.endByte);
        return Buffer.concat(this.bufArr);
    }
}