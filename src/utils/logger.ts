/* tslint:disable:no-console */
import * as colors from 'colors';

let enable = false;

export const enableLog = () => {
    enable = true;
};

export const disableLog = () => {
    enable = false;
};

export const error = (message: string) => {
    if (!enable) {
        return;
    }
    console.log(colors.red(message));
};

export const success = (message: string) => {
    if (!enable) {
        return;
    }
    console.log(colors.green(message));
};

export const info = (message: string) => {
    if (!enable) {
        return;
    }
    console.log(colors.blue(message));
};
