/* tslint:disable:no-console */
import * as colors from 'colors';


export const error = (message: string) => {
    console.log(colors.red(message));
};

export const success = (message: string) => {
    console.log(colors.green(message));
};

export const info = (message: string) => {
    console.log(colors.blue(message));
};
