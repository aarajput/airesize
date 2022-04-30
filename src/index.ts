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
import { InputSize } from './enums/input-size';
import { hideBin } from 'yargs/helpers';

export const generateAndroidImages = (input: {
    width: number | 'auto',
    height: number | 'auto',
    imagePath: string,
    outputDir: string,
}): Promise<void> => {
    return AndroidImageResizer.resizeImage({
        width: `${input.width}`,
        height: `${input.height}`,
        imagePath: input.imagePath,
        outputDir: input.outputDir,
    });
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

const start = async () => {
    const argv = await yargs(hideBin(process.argv))
        .option('help', {
            alias: 'h'
        }).option('version', {
            alias: 'v'
        }).option('android', {
            alias: 'a',
            boolean: true,
        }).option('ios', {
            alias: 'i',
            boolean: true,
        })
        .argv;
    const imagePath = _.head<any>(argv._);
    InputValidator.validateImagePath(imagePath);

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
    const imageDir = path.dirname(path.resolve(imagePath));
    const imageNameNoExt = ImageService.getImageNameWithoutExtension(imagePath);

    if (argv.android || (!argv.android && !argv.ios)) {
        await AndroidImageResizer.resizeImage({
            width,
            height,
            imagePath,
            outputDir: path.join(imageDir, imageNameNoExt, 'android'),
        });
    }

    if (argv.ios || (!argv.android && !argv.ios)) {
        await IOSImageResizer.resizeImage({
            width,
            height,
            imagePath,
            outputDir: path.join(imageDir, imageNameNoExt, 'ios'),
        });
    }
    return `All image resized successfully. You can find them in ${path.join(imageDir, imageNameNoExt)}`;
};

start().then((message) => {
    Logger.success(message);
})
    .catch((error) => {
        Logger.error(error.toString());
    });
