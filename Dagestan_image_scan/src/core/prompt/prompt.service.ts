import inquirer from 'inquirer';
import { checkConfig, saveConfig, readConfig } from '../../helpers/config.handler';
import { promptQuestions, promptStart, START_OPTIONS } from './promt.options';

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
            console.log('prompt');
            const prompt = new Prompt();
            await checkConfig();
            let { answer } = await prompt.input(promptStart);
            if(answer === START_OPTIONS.setup) {
                let input = await prompt.input(promptQuestions);
                console.log(input);
                await saveConfig(input);
                return(startCLI());
            } else {
                let conf = await readConfig();
                if (conf == 'bad' || typeof conf == 'string') {
                    console.log('Ошибка загрузки из конфигурационного файла');
                    return(startCLI());
                }
                else if (!conf) {
                    console.log('No config');
                    
                }
                else {
                    let conf = await readConfig();
                    return(conf);
                }
            } 
        }
        catch(e) {
            console.log(e);
        }
}