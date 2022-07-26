import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	verbose: true,
	preset: 'ts-jest',
	rootDir: './tests/unit',
	testRegex: 'unit-spec.ts$',
};

export default config;
