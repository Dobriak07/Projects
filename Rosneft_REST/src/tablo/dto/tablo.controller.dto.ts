import { IsString, Length } from 'class-validator';

export class TabloControllerDto {
	@IsString({ message: 'Ожидалась строка' })
	@Length(1, 100, { message: 'Строка должна быть от 1 до 100 символов длиной' })
	msg: string;
}
