import 'reflect-metadata';
import { App } from './app';
import { ExeptionFilter } from './errors/exeption.filter';
import { LoggerService } from './logger/logger.service';
import { TabloController } from './tablo/tablo.controller';
import { Container, ContainerModule, interfaces } from 'inversify';
import { TYPES } from './types';
import { ILogger } from './logger/logger.inteface';
import { IExeptionFilter } from './errors/exeption.filter.interface';
import { ITabloController } from './tablo/tablo.controller.interface';
import { ConfigService } from './config/config.service';
import { IConfigService } from './config/config.service.interface';
import { Tablo } from './tablo/tablo.service';
import { ITablo } from './tablo/tablo.service.interface';
import { TabloOld } from './tablo/tablo.builder/tablo.old';
import { TabloNew } from './tablo/tablo.builder/tablo.new';

export interface IBootstrap {
	appContainer: Container;
	app: App;
}

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
	bind<IExeptionFilter>(TYPES.ExeptionFilter).to(ExeptionFilter).inSingletonScope();
	bind<ITabloController>(TYPES.TabloController).to(TabloController).inSingletonScope();
	bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
	bind<ITablo>(TYPES.TabloService).to(Tablo).inSingletonScope();
	bind<TabloOld>(TYPES.TabloOld).to(TabloOld).inSingletonScope();
	bind<TabloNew>(TYPES.TabloNew).to(TabloNew).inSingletonScope();
	bind<App>(TYPES.Application).to(App).inSingletonScope();
});

async function bootstrap(): Promise<IBootstrap> {
	const appContainer = new Container();
	appContainer.load(appBindings);
	const app = appContainer.get<App>(TYPES.Application);

	await app.init();
	return { appContainer, app };
}

export const boot = bootstrap();
