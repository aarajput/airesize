import {
    AndroidScreenType,
    XAndroidScreenType
} from '../enums/android-screen-type';
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
    IGenerateAndroidImagesOptions
} from '../others/interfaces';

export const resizeImage = async (options: IGenerateAndroidImagesOptions) => {
    const promises: Promise<any>[] = XAndroidScreenType.values.map((screenType) =>
        resizeImageForSpecificScreenType(options, screenType));
    await Promise.all(promises);
};

const resizeImageForSpecificScreenType =
    async (options: IGenerateAndroidImagesOptions,
           screenType: AndroidScreenType) => {
        const newFileName = `${options.output.imageName}${ImageService.getImageExtension(options.input.imagePath)}`;

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
    const promises = XAndroidScreenType.values.map(async (value) => {
        const dir = path.join(options.output.dir, `mipmap-${value}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true,
            });
        }
        Logger.info(`Resizing android app icon for mipmap-${value}`);

        const fgSize = 108 * getFactorForScreenType(value);
        const resizeFactor = 0.60;
        await sharp(await sharp(Buffer.from(Constants.TRANSPARENT_SVG))
            .resize(fgSize, fgSize)
            .toBuffer())
            .composite([
                {
                    input: await sharp(options.input.foregroundIconPath)
                        .resize({
                            width: Math.round(fgSize * resizeFactor),
                            height: Math.round(fgSize * resizeFactor),
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
                {
                    input: await sharp(Buffer.from(Constants.getCircleSVG(options.input.backgroundIconColor)))
                        .resize(Math.round(roundSize * 0.9))
                        .toBuffer(),
                },
                {
                    input: await sharp(options.input.foregroundIconPath)
                        .resize({
                            width: Math.round(roundSize * resizeFactor),
                            height: Math.round(roundSize * resizeFactor),
                            fit: 'inside',
                        })
                        .toBuffer(),
                },
            ])
            .toFile(path.join(dir, `${options.output.roundIconName}.png`));
    });
    await Promise.all(promises);
    Logger.info(`Generating ${options.output.roundIconName}.xml`);
    const icAppIconRoundXml = xmlbuilder.create({
        'adaptive-icon': {
            '@xmlns:android': 'http://schemas.android.com/apk/res/android',
        },
    }, {
        encoding: 'utf-8',
    });
    icAppIconRoundXml.ele('background', {
        'android:drawable': '@color/ic_app_icon_bg',
    });
    icAppIconRoundXml.ele('foreground', {
        'android:drawable': '@mipmap/ic_app_icon_fg',
    });
    const mipMap26Dir = path.join(options.output.dir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(mipMap26Dir)) {
        fs.mkdirSync(mipMap26Dir, {
            recursive: true,
        });
    }
    fs.writeFileSync(path.join(mipMap26Dir, `${options.output.roundIconName}.xml`), icAppIconRoundXml.end({
        pretty: true,
    }));
    const valuesDir = path.join(options.output.dir, 'values');
    if (!fs.existsSync(valuesDir)) {
        fs.mkdirSync(valuesDir, {
            recursive: true,
        });
    }
    const icAppIconRoundColorXml = xmlbuilder.create('resources', {
        encoding: 'utf-8',
    }).ele('color', {
        'name': 'ic_app_icon_bg',
    }, `#${options.input.backgroundIconColor}`);
    fs.writeFileSync(path.join(valuesDir, `${options.output.colorFileName}.xml`), icAppIconRoundColorXml.end({
        pretty: true,
    }));
};

export const generateNotificationIcons = async (input: Readonly<{
    imagePath: string,
    outputDir: string,
}>): Promise<void> => {
    const promises = XAndroidScreenType.values.map(async (value) => {
        const dir = path.join(input.outputDir, `drawable-${value}`);
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
                    input: await sharp(input.imagePath)
                        .resize({
                            width: Math.round(size * 0.9),
                            height: Math.round(size * 0.9),
                            fit: 'inside',
                        })
                        .toBuffer(),
                }
            ])
            .toFile(path.join(dir, 'ic_notification.png'));
    });
    await Promise.all(promises);
};
