const inquirer = require('inquirer');
const cmdify = require('cmdify');
const { spawn } = require('node:child_process');

const loader = ['/ Installing', '| Installing', '\\ Installing', '- Installing'];
let i = 4;
const ui = new inquirer.ui.BottomBar({ bottomBar: loader[i % 4] });

setInterval(() => {
  ui.updateBottomBar(loader[i++ % 4]);
}, 300);

const cmd = spawn(cmdify('npm'), ['-g', 'install', 'inquirer'], { stdio: 'pipe' });
cmd.stdout.pipe(ui.log);
cmd.on('close', () => {
  ui.updateBottomBar('Installation done!\n');
  process.exit();
});