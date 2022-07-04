import * as Bar from 'cli-progress';
import colors from 'ansi-colors';

export type BarType = 'Uploading' | 'Processing' | 'Add person' | 'Progress';

export class CliBar {
    bar: Bar.SingleBar;
    constructor(name: BarType) {
        switch (name) {
            case 'Progress':
                this.bar = new Bar.SingleBar({
                    format: name + '  | ' + colors.green('{bar}') + ' | {percentage}% || {value}/{total} file(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                })
                break;
            case 'Uploading':
                this.bar = new Bar.SingleBar({
                    format: name + '  | ' + colors.green('{bar}') + ' | {percentage}% || {value}/{total} file(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                })
                break;
            case 'Processing':
                this.bar = new Bar.SingleBar({
                    format: name + ' | ' + colors.yellow('{bar}') + ' | {percentage}% || {value}/{total} item(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                })
                break;
            case 'Add person':
                this.bar = new Bar.SingleBar({
                    format: name + ' | ' + colors.blue('{bar}') + ' | {percentage}% || {value}/{total} item(s) |',
                    barCompleteChar: '#',
                    barIncompleteChar: '_',
                    barsize: 50,
                    // hideCursor: true,
                    clearOnComplete: true,
                    stopOnComplete: true,
                    // synchronousUpdate: true,
                    // forceRedraw: true,
                    // fps: 5,
                    // stream: process.stdout
                })
                break;
        }
    }

    start(totalValue: number, startValue: number = 0, payload?: object | undefined ) {
        this.bar.start(totalValue, startValue, payload);
    }

    increment(step?: number, payload?: object | undefined) {
        this.bar.increment(step, payload);
    }

    update(value: number, payload?: object | undefined) {
        this.bar.update(value, payload);
    }

    stop() {
        this.bar.stop();
    }

    setTotal(total: number) {
        this.bar.setTotal(total);
    }
}