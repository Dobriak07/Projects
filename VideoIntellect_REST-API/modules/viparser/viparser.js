let ViParser = class {
    constructor(data, dT) {
        this.detectorType = data.detector; // Тип детектора от VideoIntellect
        this.camUrl = data.url; // URL камеры
        this.cameraId = data.url.split('id=')[1].replace (/[^0-9]/g, ''); // Получаем ID из URL камеры, предполагаем, что видео забирается с нашего RTSP-сервера с основного потока
        this.eventTime = (new Date(data.timestamp - dT * 1000 - (new Date().getTimezoneOffset()) * 60000)).toISOString().replace('Z', ''); // Преобразуем временную метку от VideoIntellect с учетом нашей временной зоны
        this.rectangles = data.rects; // Прямоугольная обводка объектов, если есть 
        this.detector_data = data.detector_output; // Дополнительная информация по детектору от VideoIntellect
    }

    // Создаем мап uuid объекта и его прямоугольника (возможно понадобится в будущем)
    get rects() {
        let rects = new Map();
        for (let rect of this.rectangles) {
            rects.set(rect.uuid, [rect.x * 100, rect.y * 100, rect.w * 100, rect.h * 100])
        }
        return rects;
    }

    // Формируем visualization строку для SecurOS
    get visualization() {
        let visualization = '';
        if (this.rects.size != 0) {
            let i = 1;
            for (let rect of this.rects.values()) {
                visualization = visualization + 'color:red;' + 'rect:' + rect + ';' + 'font:15;reltext:' + `${rect[0]},${rect[1] - 1},${i};`
                i++;
            }
        }
        return visualization;
    }
    
    // Формируем comment строку для SecurOS в зависимости от типа детектора
    get comment() {
        let comment = '';
        switch (this.detectorType) {
            case 'dummy':
                comment = 'Тестовый детектор с периодической генерацией событий';
                break;
            case 'peoplecount2':
                comment = `Счетчик посетителей: Вошло - ${this.detector_data.in}, Вышло - ${this.detector_data.out}`
                break;
            case 'deadbody':
                comment = 'Детектор человеческой активности';
                break;
            case 'abandoned':
                comment = `Детектор оставленных предметов`;
                break;
            case 'abandoned2':
                comment = `Детектор оставленных предметов`;
                break;
            case 'direction':
                comment = `Детектор движения в заданном направлении`;
                break;
            case 'forbidden':
                comment = `Детектор движения в запрещенной зоне`;
                break;   
            case 'faulter':
                comment = `Детектор саботажа камеры`;
                break;  
            case 'service':
                comment = `Внутренний сервисный детектор службы: ${this.detector_data.type}`;
                break;
            default:
                comment = 'Unknown detector';
        }
        return comment;
    }
}

module.exports = ViParser;