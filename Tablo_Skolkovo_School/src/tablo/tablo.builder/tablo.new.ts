import 'reflect-metadata';
import iconv from 'iconv-lite';
import { injectable } from 'inversify';

@injectable()
export class TabloNew {
	private startByte: Buffer = Buffer.from('1056', 'hex');
	private addressByte: Buffer = Buffer.from('01', 'hex');
	private commandByte: Buffer = Buffer.from('23', 'hex');
	private serviceByte: Buffer = Buffer.from('640030', 'hex');
	private endByte: Buffer = Buffer.from('10FE', 'hex');

	constructor(private iterator: number = 255) {}

	tabloBuild(str: string, address?: string): Buffer {
		if (address) {
			this.addressByte = Buffer.from(`${address}`, 'hex');
		}
		const buff: Buffer[] = [];
		let iterByte: Buffer;
		let dataLength = (3 + str.length).toString(16);
		dataLength = dataLength.length == 1 ? `0${dataLength}` : dataLength;
		const lengthByte = Buffer.from(dataLength, 'hex');
		const strByte = iconv.encode(str, 'cp1251');

		if (this.iterator == 255) {
			iterByte = Buffer.from(this.getRandomIntInclusive(200, 255).toString(16), 'hex');
		} else {
			iterByte = Buffer.from(this.iterator.toString(16), 'hex');
		}

		this.iterator++;
		if (this.iterator > 199) {
			this.iterator = 0;
		}

		let controlSumTemp = parseInt('55', 16);
		const sumArr = Buffer.concat([
			this.addressByte,
			iterByte,
			this.commandByte,
			this.serviceByte,
			lengthByte,
			strByte,
		]);

		for (const item of sumArr) {
			controlSumTemp = controlSumTemp ^ item;
		}

		let controlSum = controlSumTemp.toString(16);
		controlSum = controlSum.length == 1 ? `0${controlSum}` : controlSum;

		buff.push(
			this.startByte,
			this.addressByte,
			iterByte,
			this.commandByte,
			lengthByte,
			this.serviceByte,
			strByte,
			Buffer.from(controlSum, 'hex'),
			this.endByte,
		);

		return Buffer.concat(buff);
	}

	getRandomIntInclusive(min: number, max: number): number {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}
