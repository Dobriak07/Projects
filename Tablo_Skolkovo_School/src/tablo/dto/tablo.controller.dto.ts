import { IsDefined, IsNotIn, isNotIn, IsString, Length } from 'class-validator';

export class TabloControllerDto {
	@IsString({ message: 'Value must be string' })
	@Length(1, 100, { message: 'Value length must be 1 to 100' })
	msg: string;
}
