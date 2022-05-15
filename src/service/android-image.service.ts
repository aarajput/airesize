import {
    AndroidScreenType,
    XAndroidScreenType
} from '../enums/android-screen-type';
import * as ImageService from './image.service';
import * as Logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import {InputSize} from '../enums/input-size';
import * as changeCase from 'change-case';
import * as sharp from 'sharp';
import * as xmlbuilder from 'xmlbuilder';
import {Constants} from '../others/constants';

export const resizeImage = async (input: {
    imagePath: string,
    width: string,
    height: string,
    outputDir: string,
}) => {
    const promises: Promise<any>[] = XAndroidScreenType.values.map((screenType) =>
        resizeImageForSpecificScreenType({
            ...input,
            screenType,
        }));
    await Promise.all(promises);
};

const resizeImageForSpecificScreenType = async (input: {
    imagePath: string,
    outputDir: string,
    width: string,
    height: string,
    screenType: AndroidScreenType,
}) => {
    const imageNameWithoutExt = ImageService.getImageNameWithoutExtension(input.imagePath);
    const newImageName = changeCase.snakeCase(imageNameWithoutExt);
    const newFileName = `${newImageName}${ImageService.getImageExtension(input.imagePath)}`;

    const dirPath = path.join(input.outputDir, `drawable-${input.screenType}`);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {
            recursive: true,
        });
    }
    const nWidth = input.width === InputSize.auto ? undefined : parseFloat(input.width) * getFactorForScreenType(input.screenType);
    const nHeight = input.height === InputSize.auto ? undefined : parseFloat(input.height) * getFactorForScreenType(input.screenType);

    Logger.info(`Resizing android image for screen type ${input.screenType} <${nWidth === -1 ? 'auto' : nWidth}X${nHeight === -1 ? 'auto' : nHeight}>`);
    await sharp(input.imagePath)
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

export const generateAppIcons = async (input: {
    appIconFgPath: string,
    appIconBgColor: string,
    outputDir: string,
}): Promise<void> => {
    const promises = XAndroidScreenType.values.map(async (value) => {
        const dir = path.join(input.outputDir, `mipmap-${value}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true,
            });
        }
        Logger.info(`Resizing android app icon for mipmap-${value}`);

        const fgSize = 108 * getFactorForScreenType(value);
        const resizeFactor = 0.80;
        await sharp(await sharp(Buffer.from(Constants.TRANSPARENT_SVG))
            .resize(fgSize, fgSize)
            .toBuffer())
            .composite([
                {
                    input: await sharp(input.appIconFgPath)
                        .resize({
                            width: Math.round(fgSize * resizeFactor),
                            height: Math.round(fgSize * resizeFactor),
                            fit: 'inside',
                        })
                        .toBuffer(),
                },
            ])
            .toFile(path.join(dir, 'ic_app_icon_fg.png'));

        const roundSize = 48 * getFactorForScreenType(value);
        await sharp(await sharp(Buffer.from(Constants.TRANSPARENT_SVG))
            .resize(roundSize, roundSize)
            .toBuffer())
            .composite([
                {
                    input: await sharp(Buffer.from(Constants.getCircleSVG(input.appIconBgColor)))
                        .resize(Math.round(roundSize * 0.9))
                        .toBuffer(),
                },
                {
                    input: await sharp(input.appIconFgPath)
                        .resize({
                            width: Math.round(roundSize * resizeFactor),
                            height: Math.round(roundSize * resizeFactor),
                            fit: 'inside',
                        })
                        .toBuffer(),
                },
            ])
            .toFile(path.join(dir, 'ic_app_icon_round.png'));
    });
    await Promise.all(promises);
    Logger.info(`Generating ic_app_icon_round.xml`);
    const rootXml = xmlbuilder.create({
        'adaptive-icon': {
            '@xmlns:android': 'http://schemas.android.com/apk/res/android',
        },
    }, {
        encoding: 'utf-8',
    });
    rootXml.ele('background', {
        'android:drawable': `#${input.appIconBgColor}`,
    });
    rootXml.ele('foreground', {
        'android:drawable': '@mipmap/ic_app_icon_fg',
    });
    const mipMap26Dir = path.join(input.outputDir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(mipMap26Dir)) {
        fs.mkdirSync(mipMap26Dir, {
            recursive: true,
        });
    }
    fs.writeFileSync(path.join(mipMap26Dir, 'ic_app_icon_round.xml'), rootXml.end({
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
