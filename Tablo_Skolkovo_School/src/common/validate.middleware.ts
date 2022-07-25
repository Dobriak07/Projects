import { Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ValidatorOptions } from './validator.options.interface';

export class ValidateMiddleware implements IMiddleware {
	private readonly validatorOptions: ValidatorOptions = {
		forbidUnknownValues: true,
		skipMissingProperties: false,
		stopAtFirstError: true,
		validationError: {
			target: false,
			value: false,
		},
	};
	constructor(private ClassToValidate: ClassConstructor<object>) {}

	execute({ body }: Request, res: Response, next: NextFunction): void {
		const instance = plainToClass(this.ClassToValidate, body);
		validate(instance, this.validatorOptions).then((errors: ValidationError[]) => {
			if (errors.length > 0) {
				const errObj = {
					err: errors.map((value) => {
						if (value.constraints) {
							return value.constraints[Object.keys(value.constraints)[0]];
						}
					}),
				};
				res.status(422).send(errObj);
			} else {
				next();
			}
		});
	}
}
