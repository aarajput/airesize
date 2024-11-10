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
    IGenerateAndroidImagesOptions,
    IGenerateAndroidNotificationIcons,
    IGenerateIOSAppIcons,
    IGenerateIOSImages
} from './others/interfaces';
import {XAndroidScreenType} from './enums/android-screen-type';
import {XIOSScreenType} from './enums/ios-screen-type';

export {InputSize} from './enums/input-size';

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

export const generateAndroidNotificationIcons = (options: IGenerateAndroidNotificationIcons): Promise<void> => {
    return AndroidImageResizer.generateNotificationIcons(options);
};

export const generateIOSImages = (options: IGenerateIOSImages): Promise<void> => {
    return IOSImageResizer.resizeImage(options);
};

export const generateIOSAppIcons = (options: IGenerateIOSAppIcons): Promise<void> => {
    return IOSImageResizer.generateAppIcons(options);
};

const getSizeFromUser = async (): Promise<{
    width: number | InputSize.auto;
    height: number | InputSize.auto;
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
    const width = size.width.toString().trim().toLowerCase();
    const height = size.height?.toString().trim().toLowerCase();
    InputValidator.validateSize('Width', width as string);
    InputValidator.validateSize('Height', height as string);
    InputValidator.validateWidthAndHeight(width, height);
    return {
        width: width === InputSize.auto ? width : parseFloat(width),
        height: height === InputSize.auto ? height : parseFloat(height),
    };
}

const getAppIconBgColorFromUser = async (options?: {
    optional?: boolean,
}): Promise<string | undefined> => {
    const input = await prompt.get({
        properties: {
            color: {
                description: `App Icon Background Color ${options?.optional ? '(Optional)' : ''}: e.g: FFFFFF`,
                default: options?.optional ? undefined : 'FFFFFF',
                allowEmpty: options?.optional,
            },
        },
    });
    const color = input.color.toString().trim().toUpperCase();
    InputValidator.validateColor({
        fieldName: 'App Icon Background Color',
        color,
        optional: options?.optional,
    });
    return color || undefined;
};

const run = async () => {
    Logger.enableLog();

    const argv = await yargs(hideBin(process.argv))
        .option('help', {
            alias: 'h'
        }).option('android', {
            alias: 'a',
            boolean: true,
            description: `Generate android ${XAndroidScreenType.values.map((t) => `drawable-${t}`).join(', ')} according to given size`,
        }).option('android-app-icon', {
            alias: 'b',
            boolean: true,
            description: `Generate android app icons`,
        }).option('padding-factor', {
            alias: 'p',
            number: true,
            description: 'Set padding factor of android/ios icon foreground. 0<padding-factor<=1. 0 means no padding. 0.5 means 50% padding.',
        }).option('android-notification-icon', {
            alias: 'c',
            boolean: true,
            description: `Generate android notification icons`,
        }).option('ios', {
            alias: 'i',
            boolean: true,
            description: `Generate ios ${XIOSScreenType.values.join(', ')} according to given size`,
        }).option('ios-app-icon', {
            alias: 'j',
            boolean: true,
            description: `Generate ios app icons`,
        })
        .argv;
    if (!argv.android && !argv.ios && !argv.iosAppIcon && !argv.androidAppIcon && !argv.androidNotificationIcon) {
        throw new Error('Pass at-least one argument --android, --android-app-icon, --android-notification-icon, --ios or/and --ios-app-icon');
    }
    if (argv.paddingFactor && !argv.iosAppIcon && !argv.androidAppIcon) {
        throw new Error('padding-factor is only used with --ios-app-icon or android-app-icon');
    }
    const imagePath = _.head<any>(argv._);
    InputValidator.validateImagePath(imagePath);

    const imageDir = path.dirname(path.resolve(imagePath));
    const imageNameWithoutExt = ImageService.getImageNameWithoutExtension(imagePath);

    if (argv.android) {
        const {
            width,
            height,
        } = await getSizeFromUser();
        const snakeCaseImageName = changeCase.snakeCase(imageNameWithoutExt);
        await AndroidImageResizer.resizeImage({
            input: {
                imagePath,
            },
            output: {
                width,
                height,
                dir: path.join(imageDir, imageNameWithoutExt, 'android'),
                imageName: snakeCaseImageName,
            },
        });
    }
    if (argv.androidAppIcon) {
        const backgroundIconColor = await getAppIconBgColorFromUser();
        await AndroidImageResizer.generateAppIcons({
            input: {
                foregroundIconPath: imagePath,
                foregroundIconPaddingFactor: argv.paddingFactor,
                backgroundIconColor: backgroundIconColor!,
            },
            output: {
                dir: path.join(imageDir, imageNameWithoutExt, 'android-app-icons'),
                mainIconName: 'ic_app_icon_round',
                foregroundIconName: 'ic_app_icon_fg',
                colorFileName: 'app_icon_colors',
                backgroundIconOrColorName: 'ic_app_icon_bg',
            },
        });
    }
    if (argv.androidNotificationIcon) {
        await AndroidImageResizer.generateNotificationIcons({
            input: {
                imagePath,
            },
            output: {
                dir: path.join(imageDir, imageNameWithoutExt, 'android-notification-icons'),
                imageName: 'ic_notification',
            },
        });
    }

    if (argv.ios) {
        const {
            width,
            height,
        } = await getSizeFromUser();
        const pascalCaseImageName = changeCase.pascalCase(imageNameWithoutExt);
        await IOSImageResizer.resizeImage({
            input: {
                imagePath,
            },
            output: {
                width,
                height,
                dir: path.join(imageDir, imageNameWithoutExt, 'ios'),
                imageName: pascalCaseImageName,
            },
        });
    }
    if (argv.iosAppIcon) {
        const backgroundIconColor = await getAppIconBgColorFromUser({
            optional: true,
        });
        if (!backgroundIconColor && argv.paddingFactor) {
            throw new Error('padding-factor is only used when icon background is passed');
        }
        await IOSImageResizer.generateAppIcons({
            input: {
                iconPath: imagePath,
                iconColor: backgroundIconColor,
                iconPaddingFactor: argv.paddingFactor,
            },
            output: {
                dir: path.join(imageDir, imageNameWithoutExt, `${changeCase.pascalCase(imageNameWithoutExt)}.appiconset`),
                iconName: changeCase.capitalCase(imageNameWithoutExt, {
                    delimiter: '-',
                }),
            },
        });
    }
    return `All images resized successfully. You can find them in ${path.join(imageDir, imageNameWithoutExt)}`;
};

if (require.main === module) {
    run().then((message) => {
        Logger.success(message);
    })
        .catch((error) => {
            Logger.error(error.toString());
        });
}
