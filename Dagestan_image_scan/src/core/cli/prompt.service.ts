import inquirer from 'inquirer';
import { checkConfig, saveConfig, readConfig } from '../../helpers/config.handler';
import { promptQuestions, promptStart, START_OPTIONS } from './promt.options';
import readline from 'readline';
import { Conf } from '../types/myTypes';
const delay = async (ms: number) => await new Promise(resolve => setTimeout(resolve, ms));

type InquerierPromt = inquirer.QuestionCollection<inquirer.Answers>;
type InquerierAnswers = inquirer.Answers;

class Prompt {
    bottomBar; 
    constructor() {
        this.bottomBar = new inquirer.ui.BottomBar();
    }
    public async input(questions: InquerierPromt): Promise<InquerierAnswers> {
        const result = await inquirer.prompt(questions);
        return result;
    };
}

export async function startCLI(): Promise<any> {
        try {
            const prompt = new Prompt();
            let configCheck = await checkConfig();
            console.log(configCheck);
            let { answer } = await prompt.input(promptStart);
            if(answer === START_OPTIONS.setup) {
                let input = await prompt.input(promptQuestions);
                console.log(input);
                let configSave = await saveConfig(input);
                console.log(configSave);
                return(startCLI());
            } else {
                let conf = await readConfig();
                if (conf == 'bad' || typeof conf == 'string') {
                    console.log('Ошибка загрузки из конфигурационного файла');
                    return(startCLI());
                }
                else if (!conf) {
                    console.log('Конфигурационный файл не найден');
                }
                else {
                    let conf = await readConfig();
                    return(conf);
                }
            } 
        }
        catch(err) {
            throw err;
        }
}

export async function startOnGoodConfig(): Promise<undefined | {start: number, conf: Conf | string}> {
    let configCheck = await checkConfig();
    let conf = await readConfig();
    if (configCheck == 'Конфигурация найдена') {
        console.log('Конфигурация найдена');
        // console.log('Start in 10 sec');
        return new Promise(async (resolve, reject) => {
            let status = 0;
            readline.emitKeypressEvents(process.stdin);
            // let start = setTimeout(() => {
            //     resolve({start: 0, conf: conf});
            // }, 5000);
            process.stdin.setRawMode(true);
            process.stdin.on('keypress', (str, key) => {
                if (key.ctrl && key.name === 'c') {
                    process.exit();
                } else {
                    // clearTimeout(start);
                    status = 1;
                    resolve({start: 1, conf: conf});
                }
            });
            let i = 10;
            while (i != 0 && status == 0) {
                process.stdout.write(`Start in ${i} sec. Press any key to cancell   \r`);
                // console.log(`Start in ${i} sec. Press any key to cancell`);
                await delay(1000);
                i--;
                // console.clear();
            }
            if (status == 0) {
                process.stdin.setRawMode(false);
                process.stdin.destroy();;
                resolve({start: 0, conf: conf});
            }
        })
    }
}