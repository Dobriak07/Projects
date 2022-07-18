import { App } from "./app";
import { ExeptionFilter } from "./errors/exeption.filter";
import { LoggerService } from "./logger/logger.service";
import { TabloController } from "./tablo/tablo.controller";
import 'reflect-metadata';
import { Container, ContainerModule, interfaces } from "inversify";
import { TYPES } from "./types";
import { ILogger } from "./logger/logger.inteface";
import { IExeptionFilter } from "./errors/exeption.filter.interface";
import { ITabloController } from "./tablo/tablo.controller.interface";

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
    bind<ILogger>(TYPES.ILogger).to(LoggerService);
    bind<IExeptionFilter>(TYPES.ExeptionFilter).to(ExeptionFilter);
    bind<ITabloController>(TYPES.TabloController).to(TabloController);
    bind<App>(TYPES.Application).to(App);
})

function bootstrap() {
    const appContainer = new Container();
    appContainer.load(appBindings);
    const app = appContainer.get<App>(TYPES.Application);

    app.init();
    return { appContainer, app };
};

export const { appContainer, app } = bootstrap();


