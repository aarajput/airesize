#!/usr/bin/env node

import * as Logger from './utils/logger';
import * as prompt from 'prompt';
import * as InputValidator from './validators/input.validator';
import * as AndroidImageResizer from './service/android-image.service';
import * as IOSImageResizer from './service/ios-image.service';
import * as ImageService from './service/image.service';
import * as yargs from 'yargs';
import * as path from 'path';
import * as _ from 'lodash';
import * as changeCase from 'change-case';
import {InputSize} from './enums/input-size';
import {hideBin} from 'yargs/helpers';
import {
    IGenerateAndroidAppIconOptions,
    IGenerateAndroidImagesOptions
} from './others/interfaces';

export const enableLog = () => {
    Logger.enableLog();
};

export const disableLog = () => {
    Logger.disableLog();
};

export const generateAndroidImages = (options: IGenerateAndroidImagesOptions): Promise<void> => {
    return AndroidImageResizer.resizeImage(options);
};

export const generateAndroidAppIcons = (options: IGenerateAndroidAppIconOptions)
    : Promise<void> => {
    return AndroidImageResizer.generateAppIcons(options);
};

export const generateAndroidNotificationIcons = (input: {
    imagePath: string,
    outputDir: string,
}): Promise<void> => {
    return AndroidImageResizer.generateNotificationIcons(input);
};

export const generateIOSImages = (input: {
    width: number | 'auto',
    height: number | 'auto',
    imagePath: string,
    outputDir: string,
}): Promise<void> => {
    return IOSImageResizer.resizeImage({
        width: `${input.width}`,
        height: `${input.height}`,
        imagePath: input.imagePath,
        outputDir: input.outputDir,
    });
};

export const generateIOSAppIcons = (input: {
    imagePath: string,
    outputDir: string,
}): Promise<void> => {
    return IOSImageResizer.generateAppIcons(input);
};

const getSizeFromUser = async (): Promise<{
    width: string;
    height: string;
}> => {
    const size = await prompt.get([
        {
            properties: {
                width: {
                    description: `Width: {${InputSize.auto} | number}`,
                    default: 'auto',
                },
            },
        },
        {
            properties: {
                height: {
                    description: `Height: {${InputSize.auto} | number}`,
                    default: 'auto',
                },
            },
        },
    ]);
    const width = size.width.toString().toLowerCase();
    const height = size.height?.toString().toLowerCase();
    InputValidator.validateSize('Width', width as string);
    InputValidator.validateSize('Height', height as string);
    InputValidator.validateWidthAndHeight(width, height);
    return {
        width,
        height,
    };
}

const getAppIconBgColorFromUser = async (): Promise<string> => {
    const input = await prompt.get({
        properties: {
            color: {
                description: `App Icon Background Color: e.g: FFFFFF`,
                default: 'FFFFFF',
            },
        },
    });
    const color = input.color.toString().toUpperCase();
    InputValidator.validateColor('App Icon Background Color', color);
    return color;
};

const run = async () => {
    Logger.enableLog();

    const argv = await yargs(hideBin(process.argv))
        .option('help', {
            alias: 'h'
        }).option('android', {
            alias: 'a',
            boolean: true,
        }).option('android-app-icon', {
            alias: 'b',
            boolean: true,
        }).option('android-notification-icon', {
            alias: 'c',
            boolean: true,
        }).option('ios', {
            alias: 'i',
            boolean: true,
        }).option('ios-app-icon', {
            alias: 'j',
            boolean: true,
        })
        .argv;
    if (!argv.android && !argv.ios && !argv.iosAppIcon && !argv.androidAppIcon && !argv.androidNotificationIcon) {
        throw new Error('Pass alteast one argument --android, --android-app-icon, --android-notification-icon, --ios or/and --ios-app-icon');
    }
    const imagePath = _.head<any>(argv._);
    InputValidator.validateImagePath(imagePath);

    const imageDir = path.dirname(path.resolve(imagePath));
    const imageNameNoExt = ImageService.getImageNameWithoutExtension(imagePath);

    if (argv.android) {
        const {
            width,
            height,
        } = await getSizeFromUser();
        const imageNameWithoutExt = ImageService.getImageNameWithoutExtension(imagePath);
        const snakeCaseImageName = changeCase.snakeCase(imageNameWithoutExt);
        await AndroidImageResizer.resizeImage({
            input: {
                imagePath,
            },
            output: {
                width: width === InputSize.auto ? width : parseFloat(width),
                height: height === InputSize.auto ? height : parseFloat(height),
                dir: path.join(imageDir, imageNameNoExt, 'android'),
                imageName: snakeCaseImageName,
            },
        });
    }
    if (argv.androidAppIcon) {
        const backgroundIconColor = await getAppIconBgColorFromUser();
        await AndroidImageResizer.generateAppIcons({
            input: {
                foregroundIconPath: imagePath,
                backgroundIconColor,
            },
            output: {
                dir: path.join(imageDir, imageNameNoExt, 'android-app-icons'),
                roundIconName: 'ic_app_icon_round',
                foregroundIconName: 'ic_app_icon_fg',
                colorFileName: 'app_icon_colors'
            },
        });
    }
    if (argv.androidNotificationIcon) {
        await AndroidImageResizer.generateNotificationIcons({
            imagePath,
            outputDir: path.join(imageDir, imageNameNoExt, 'android-notification-icons'),
        });
    }

    if (argv.ios) {
        const {
            width,
            height,
        } = await getSizeFromUser();
        await IOSImageResizer.resizeImage({
            width,
            height,
            imagePath,
            outputDir: path.join(imageDir, imageNameNoExt, 'ios'),
        });
    }
    if (argv.iosAppIcon) {
        await IOSImageResizer.generateAppIcons({
            imagePath,
            outputDir: path.join(imageDir, imageNameNoExt, 'ios-app-icons'),
        });
    }
    return `All images resized successfully. You can find them in ${path.join(imageDir, imageNameNoExt)}`;
};

if (require.main === module) {
    run().then((message) => {
        Logger.success(message);
    })
        .catch((error) => {
            Logger.error(error.toString());
        });
}
