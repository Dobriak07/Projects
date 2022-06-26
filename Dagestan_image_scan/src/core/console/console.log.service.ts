import chalk from 'chalk';

const printError = (err: string) => {
    // console.clear();
    console.log(
        `${chalk.bgRed('ERROR:')} ${chalk.red(err)}`
    );
}

const printMessage= (msg: string) => {
    // console.clear();
    console.log(`${chalk.bgGrey('INFO:')} ${chalk.grey(msg)}`);
}

export { printError, printMessage };