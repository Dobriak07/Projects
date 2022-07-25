export interface ValidatorOptions {
	skipMissingProperties?: boolean;
	whitelist?: boolean;
	forbidNonWhitelisted?: boolean;
	groups?: string[];
	dismissDefaultMessages?: boolean;
	validationError?: {
		target?: boolean;
		value?: boolean;
	};

	forbidUnknownValues?: boolean;
	stopAtFirstError?: boolean;
}
