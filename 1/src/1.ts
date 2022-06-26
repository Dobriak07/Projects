import inquirer from "inquirer";

let prompt = new inquirer.ui.BottomBar();

for (let i = 1; i < 10; i++) {
    setTimeout(() => {
        prompt.updateBottomBar(`${i}`)
    }, 500);
}