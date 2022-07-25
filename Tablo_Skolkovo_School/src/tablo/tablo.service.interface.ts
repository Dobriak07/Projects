export interface ITablo {
	check: (port: number, host: string) => Promise<boolean>;
	send: (msg: Buffer, port: number, host: string) => Promise<boolean>;
}

export type TabloState = 'online' | 'offline';
