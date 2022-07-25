import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	verbose: true,
	preset: 'ts-jest',
	rootDir: './tests/e2e',
	testRegex: 'e2e-spec.ts$',
};

export default config;
