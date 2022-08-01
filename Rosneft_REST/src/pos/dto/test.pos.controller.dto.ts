import { IsDateString, IsNumber, IsString } from 'class-validator';

export class PosControllerDtoTest {
	// @IsNumber({ allowNaN: false }, { message: 'Expected number' })
	FunctionNumber: number; // Номер события, в соответствие с Таблицей 2

	// @IsDateString()
	TransactionTimestamp: string; // Дата и время события

	// @IsNumber({ allowNaN: false }, { message: 'Expected number' })
	Terminal: number; // Номер кассы или условный номер терминала для Trade House

	// @IsNumber({ allowNaN: false }, { message: 'Expected number' })
	MessageId: number; // Уникальный идентификатор записи каждого АРМ

	// @IsString({ message: 'Expected string' })
	PrintNum: string; // Номер ФР

	// @IsNumber({ allowNaN: false }, { message: 'Expected number' })
	ShopNum: number; // Номер магазина

	// @IsString({ message: 'Expected string' })
	IP: string; // IP адрес сервера Trade House

	// @IsString({ message: 'Expected string' })
	HostName: string; // HostName сервера Trade House

	// @IsString({ message: 'Expected string' })
	UserName: string; // UserName сервера Trade House

	// @IsNumber({ allowNaN: false }, { message: 'Expected number' })
	Result: number; // Результат выполнения, 0 - успешно, в противном - код ошибки

	// @IsString({ message: 'Expected string' })
	Description: string; // Описание ошибки, если Result ≠ 0
}
