import inquirer from 'inquirer';

export type InquerierPromt = inquirer.QuestionCollection<inquirer.Answers>;
export type InquerierAnswers = inquirer.Answers;

export class Prompt {
    public async input(questions: InquerierPromt): Promise<InquerierAnswers> {
        const result = await inquirer.prompt(questions);
        return result;
    };
}
