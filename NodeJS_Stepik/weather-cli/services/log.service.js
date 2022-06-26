import chalk from 'chalk';
import dedent from 'dedent-js';

const printError = (err) => {
    console.log(chalk.bgRed('ERROR') + ' ' + err)
};

const printSuccess = (msg) => {
    console.log(chalk.bgGreen('SUCCESS') + ' ' + msg)
};

const printResult = (res, icon) => {
    console.log(
        dedent(`${chalk.bgYellow(' WEATHER ')} Weather in city ${res.name}
        ${icon} ${res.weather[0].description}
        Temperature: ${res.main.temp} (feels like ${res.main.feels_like})
        Humidity: ${res.main.humidity}%
        Wind speed: ${res.wind.speed}
        `)
    );
}

const printHelp = () => {
    console.log(
        dedent(`${chalk.bgCyan(' HELP ')}
        Без параметров - вывод погоды
        -s [CITY] для установки города
        -t [API_TOKEN] для сохранения токена
        -h вывод подсказки
        `)
    );
}

export { printError, printSuccess, printHelp, printResult };