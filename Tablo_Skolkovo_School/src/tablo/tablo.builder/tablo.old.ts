import 'reflect-metadata';
import iconv from 'iconv-lite';
import { injectable } from 'inversify';

interface ITabloEffects {
	[index: string]: string;
}

interface IClock {
	[index: string]: string;
}

@injectable()
export class TabloOld {
	private startByte: Buffer = Buffer.from('1021', 'hex');
	private endByte: Buffer = Buffer.from('10FE', 'hex');
	private tabloEffects: ITabloEffects = {
		/* Эффекты паузы */
		p0: 'af', // <p0> - Отмена автопаузы – отменяет автоматическую паузу после эффектов появления.0xaf  - <P0>
		p1: 'a1', // <p1> - вставляет в сообщение паузу длительностью примерно 0,5 секунды.
		p2: 'a2', // <p2> - вставляет в сообщение паузу длительностью примерно 1 секунда. -3-
		p3: 'a3', // <p3> - вставляет в сообщение паузу длительностью примерно 3 секунды.
		p4: 'a4', // <p4> - вставляет в сообщение паузу длительностью примерно 5 секунд.
		p5: 'a5', // <p5> - вставляет в сообщение паузу длительностью примерно 10 секунд.
		bl: '4b', // <BL> - однократное мигание
		bi: '4c', // <BI> - инверсное мигание
		/* Эффекты движения */
		v1: 'b1', // <v1> - устанавливает скорость движения информации  1 (максимальная скорость движения информации).
		v2: 'b2', // <v2> - устанавливает скорость движения информации  2.
		v3: 'b3', // <v3> - устанавливает скорость движения информации  3.
		v4: 'b4', // <v4> - устанавливает скорость движения информации  4.
		v5: 'b5', // <v5> - устанавливает скорость движения информации  5.
		v6: 'b6', // <v6> - устанавливает скорость движения информации  6  (самая медленная скорость).
		// 'v7': 'b7',
		// 'v8': 'b8'
		/* Эффекты появления */
		d0: '68', // <d0> - Появление снизу с замещением предыдущего текста.
		d1: '69', // <d1> - Появление снизу с замещением предыдущего текста.
		d2: '6a', // <d2> - Появление сверху с замещением предыдущего текста.
		d3: '6b', // <d3> - Появление снизу с выталкиванием предыдущего текста.
		d4: '6c', // <d4> - Появление сверху с выталкиванием предыдущего текста.
		d5: '6d', // <d5> - Плавное появление по точкам.
		d6: '6e', // <d6> - Шторки к центру с замещением предыдущего текста.
		d7: '6f', // <d7> - Шторки к центру с выталкиванием предыдущего текста.
		d8: '70', // <d8> - Шторки от центра с замещением предыдущего текста.
		d9: '71', // <d9> - Шторки от центра с выталкиванием предыдущего текста.
		d10: '72', // <d10> - Шторки к центру
		d11: '73', // <d11> - Шторки от центра
		d12: '74', // <d12>  - Шторки горизонтальные к центру
		d13: '75', // <d13> - Шторки горизонтальные от центра
		d14: '76', // <d14> - Появление по буквам слева
		d15: '77', // <d15> - Появление по буквам с вытягиванием
		d16: '78', // <d16> - Появление по буквам  сверху
		d17: '79', // <d17> - Появление по буквам снизу
		d18: '7a', // <d18> - Появление по буквам чередование
		d19: '7b', // <d19> - Появление по буквам печать
		d20: '7c', // <d20> - Движение справа налево с паузами
		d21: '7d', // <d21> - Движение слева направо с паузами
		/* Эффекты центровки */
		c0: '60', //<C0> - Выключает автоматическую центровку текста.
		c1: '61', //<C1> - Включает автоматическую центровку текста.
		/* Размер шрифта */
		f6: 'e0', //<F6> - Переключает табло в режим вывода информации узким шрифтом (6х8 точек).
		f8: 'e1', //<F8> - Переключает табло в режим вывода информации широким шрифтом (8х8 точек).
		/* Вывод даты-времени */
		t1: 'c1', //<t1> - выводит текущее время в формате ЧЧ:ММ (ЧАС:МИНУТЫ)
		t2: 'c2', //<t2> - выводит значение даты и месяц.
		t3: 'c3', //<t3> - выводит день недели.
		t4: 'c5', //<t4> - выводит текущий год.
		/* Перенос строки */
		nl: '0a',
		/* Возврат каретки */
		rc: '0d',
	};

	tabloBuild(str: string, address?: string): Buffer {
		if (address) {
			this.startByte = Buffer.from(`102${address}`, 'hex');
		}
		const arr = str.split(/[[\]]/g).filter((v) => v != '');
		const buff: Buffer[] = [];
		buff.push(this.startByte);

		for (const item of arr) {
			if (item.length == 2 && Object.keys(this.tabloEffects).includes(item.toLowerCase())) {
				buff.push(Buffer.from(`ff${this.tabloEffects[item.toLowerCase()]}`, 'hex'));
			} else {
				buff.push(iconv.encode(item, 'cp866'));
			}
		}

		buff.push(this.endByte);
		return Buffer.concat(buff);
	}

	setupClock(): Buffer {
		const dateNow = new Date();
		const arr: Buffer[] = [];
		arr.push(Buffer.from('10f7', 'hex'));

		const clock: IClock = {
			seconds: `${dateNow.getSeconds()}`,
			minutes: `${dateNow.getMinutes()}`,
			hours: `${dateNow.getHours()}`,
			weekday: `${dateNow.getDay() + 1}`,
			date: `${dateNow.getDate()}`,
			month: `${dateNow.getMonth() + 1}`,
			year: `${1 * Number(dateNow.getFullYear().toString().slice(-2))}`,
		};

		const sum =
			parseInt(clock.seconds.toString(), 16) ^
			parseInt(clock.minutes.toString(), 16) ^
			parseInt(clock.hours.toString(), 16) ^
			parseInt(clock.weekday.toString(), 16) ^
			parseInt(clock.date.toString(), 16) ^
			parseInt(clock.month.toString(), 16) ^
			parseInt(clock.year.toString(), 16) ^
			parseInt('55', 16);

		for (const key in clock) {
			if (Number(clock[key]) < 10 && key != 'year') {
				clock[key] = `0${clock[key]}`;
			}
		}

		const str = `${clock.seconds}${clock.minutes}${clock.hours}${clock.weekday}${clock.date}${
			clock.month
		}${clock.year}${(sum * 1).toString(16)}`;

		arr.push(Buffer.from(str, 'hex'));
		arr.push(this.endByte);
		return Buffer.concat(arr);
	}
}
