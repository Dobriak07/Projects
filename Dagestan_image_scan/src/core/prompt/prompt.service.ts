import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection)

export type InquerierPromt = inquirer.QuestionCollection<inquirer.Answers>;
export type InquerierAnswers = inquirer.Answers;

export class Prompt {
    public async input(questions: InquerierPromt): Promise<InquerierAnswers> {
        const result = await inquirer.prompt(questions);
        return result;
    };
}
