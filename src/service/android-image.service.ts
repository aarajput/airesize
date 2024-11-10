import {AndroidScreenType, XAndroidScreenType} from '../enums/android-screen-type';
import * as ImageService from './image.service';
import * as Logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import {InputSize} from '../enums/input-size';
import * as sharp from 'sharp';
import * as xmlbuilder from 'xmlbuilder';
import {Constants} from '../others/constants';
import {
    IGenerateAndroidAppIconOptions,
    IGenerateAndroidImagesOptions,
    IGenerateAndroidNotificationIcons
} from '../others/interfaces';

export const resizeImage = async (options: IGenerateAndroidImagesOptions) => {
    const promises: Promise<any>[] = XAndroidScreenType.values.map((screenType) =>
        resizeImageForSpecificScreenType(options, screenType));
    await Promise.all(promises);
};

const resizeImageForSpecificScreenType =
    async (options: IGenerateAndroidImagesOptions,
           screenType: AndroidScreenType) => {
        let newFileExtension = ImageService.getImageExtension(options.input.imagePath);
        if (newFileExtension === '.svg') {
            newFileExtension = '.png';
        }
        const newFileName = `${options.output.imageName}${newFileExtension}`;

        const dirPath = path.join(options.output.dir, `drawable-${screenType}`);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {
                recursive: true,
            });
        }
        const nWidth = options.output.width === InputSize.auto ? undefined : options.output.width * getFactorForScreenType(screenType);
        const nHeight = options.output.height === InputSize.auto ? undefined : options.output.height * getFactorForScreenType(screenType);

        Logger.info(`Resizing android image for screen type ${screenType} <${nWidth === undefined ? 'auto' : nWidth}X${nHeight === undefined ? 'auto' : nHeight}>`);
        await sharp(options.input.imagePath)
            .resize({
                width: nWidth,
                height: nHeight,
            })
            .toFile(path.join(dirPath, newFileName));
    };

const getFactorForScreenType = (screenType: AndroidScreenType): number => {
    switch (screenType) {
        case AndroidScreenType.mdpi:
            return 1;
        case AndroidScreenType.hdpi:
            return 1.5;
        case AndroidScreenType.xhdpi:
            return 2;
        case AndroidScreenType.xxhdpi:
            return 3;
        case AndroidScreenType.xxxhdpi:
            return 4;
    }
};

export const generateAppIcons = async (options: IGenerateAndroidAppIconOptions)
    : Promise<void> => {
    if (options.input.backgroundIconColor && options.input.backgroundIconPath) {
        throw Error('You can not set both input.backgroundIconColor and input.backgroundIconPath values.');
    }
    if (!options.input.backgroundIconColor && !options.input.backgroundIconPath) {
        throw Error('You need to set either input.backgroundIconColor or input.backgroundIconPath values.');
    }
    if (options.input.backgroundIconColor && !options.output.colorFileName) {
        throw Error('output.colorFileName is required if input.backgroundIconColor is passed');
    }
    if (options.input.foregroundIconPaddingFactor && (options.input.foregroundIconPaddingFactor < 0 || options.input.foregroundIconPaddingFactor >= 1)) {
        throw Error('options.input.foregroundIconResizeFactor should be 0<=foregroundIconPadding<1');
    }
    const promises = XAndroidScreenType.values.map(async (value) => {
        const dir = path.join(options.output.dir, `mipmap-${value}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true,
            });
        }
        Logger.info(`Resizing android app icon for mipmap-${value}`);

        const fgSize = 108 * getFactorForScreenType(value);
        const paddingFactorInverse = 1 - (options.input.foregroundIconPaddingFactor ?? 0);
        const resizeFactorV26 = 0.48 * paddingFactorInverse;
        const resizeFactor = 0.64 * paddingFactorInverse;
        await sharp(await sharp(Buffer.from(Constants.TRANSPARENT_SVG))
            .resize(fgSize, fgSize)
            .toBuffer())
            .composite([
                {
                    input: await sharp(options.input.foregroundIconPath)
                        .resize({
                            width: Math.round(fgSize * resizeFactorV26),
                            fit: 'inside',
                        })
                        .toBuffer(),
                },
            ])
            .toFile(path.join(dir, `${options.output.foregroundIconName}.png`));

        const roundSize = 48 * getFactorForScreenType(value);
        await sharp(await sharp(Buffer.from(Constants.TRANSPARENT_SVG))
            .resize(roundSize, roundSize)
            .toBuffer())
            .composite([
                (options.input.backgroundIconColor ? {
                    input: await sharp(Buffer.from(Constants.getCircleSVG(options.input.backgroundIconColor)))
                        .resize(Math.round(roundSize * 0.9))
                        .toBuffer(),
                } : null),
                (options.input.backgroundIconPath ? {
                    input: await sharp(Buffer.from(options.input.backgroundIconPath))
                        .resize(Math.round(roundSize * 0.9))
                        .toBuffer(),
                } : null),
                {
                    input: await sharp(options.input.foregroundIconPath)
                        .resize({
                            width: Math.round(roundSize * resizeFactor),
                            height: Math.round(roundSize * resizeFactor),
                            fit: 'inside',
                        })
                        .toBuffer(),
                },
            ].filter((value) => value)
                .map((value) => value!))
            .toFile(path.join(dir, `${options.output.mainIconName}.png`));
    });
    await Promise.all(promises);
    Logger.info(`Generating ${options.output.mainIconName}.xml`);
    const icAppIconXml = xmlbuilder.create({
        'adaptive-icon': {
            '@xmlns:android': 'http://schemas.android.com/apk/res/android',
        },
    }, {
        encoding: 'utf-8',
    });
    icAppIconXml.ele('background', {
        'android:drawable': `@color/${options.output.backgroundIconOrColorName}`,
    });
    icAppIconXml.ele('foreground', {
        'android:drawable': `@mipmap/${options.output.foregroundIconName}`,
    });
    const mipMap26Dir = path.join(options.output.dir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(mipMap26Dir)) {
        fs.mkdirSync(mipMap26Dir, {
            recursive: true,
        });
    }
    fs.writeFileSync(path.join(mipMap26Dir, `${options.output.mainIconName}.xml`), icAppIconXml.end({
        pretty: true,
    }));
    const valuesDir = path.join(options.output.dir, 'values');
    if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, {
            recursive: true,
        });
    }
    if (options.input.backgroundIconColor) {
        const icAppIconColorXml = xmlbuilder.create('resources', {
            encoding: 'utf-8',
        }).ele('color', {
            'name': options.output.backgroundIconOrColorName,
        }, `#${options.input.backgroundIconColor}`);
        fs.writeFileSync(path.join(valuesDir, `${options.output.colorFileName}.xml`), icAppIconColorXml.end({
            pretty: true,
        }));
    }
};

export const generateNotificationIcons = async (options: IGenerateAndroidNotificationIcons): Promise<void> => {
    const promises = XAndroidScreenType.values.map(async (value) => {
        const dir = path.join(options.output.dir, `drawable-${value}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true,
            });
        }
        Logger.info(`Resizing android app icon for drawable-${value}`);
        const size = 24 * getFactorForScreenType(value);
        await sharp(await sharp(Buffer.from(Constants.TRANSPARENT_SVG))
            .resize({
                width: size,
                height: size,
            }).toBuffer())
            .composite([
                {
                    input: await sharp(options.input.imagePath)
                        .resize({
                            width: Math.round(size * 0.9),
                            height: Math.round(size * 0.9),
                            fit: 'inside',
                        })
                        .toBuffer(),
                }
            ])
            .toFile(path.join(dir, `${options.output.imageName}.png`));
    });
    await Promise.all(promises);
};
