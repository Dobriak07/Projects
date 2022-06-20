import dedent from 'dedent';
import chalk from 'chalk';

const printError = (err) => {
    console.log(
        `${chalk.bgRed('ERROR:')} ${chalk.red(err)}`
    );
}

const printMessage= (msg) => {
    console.log(`${chalk.bgGrey('INFO:')} ${chalk.grey(msg)}`);
}

export { printError, printMessage };