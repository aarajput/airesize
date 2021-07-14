import * as jimp from 'jimp';
import { AndroidScreenType, XAndroidScreenType } from '../enums/android-screen-type';
import * as ImageService from './image.service';
import * as Logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import { InputSize } from '../enums/input-size';

export const resizeImage = async (input: {
    imagePath: string,
    width: string,
    height: string,
}) => {
    const baseDir = ImageService.getImageNameWithoutExtension(input.imagePath);
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir);
    }
    const promises: Promise<any>[] = [];
    XAndroidScreenType.values.forEach((screenType) => {
        promises.push(resizeImageForSpecificScreenType({
            ...input,
            screenType,
        }));
    });
    await Promise.all(promises);
};

const resizeImageForSpecificScreenType = async (input: {
    imagePath: string,
    width: string,
    height: string,
    screenType: AndroidScreenType,
}) => {
    const dirPath = path.join(ImageService.getImageNameWithoutExtension(input.imagePath), input.screenType);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    const imageNameWithExt = ImageService.getImageNameWithExtension(input.imagePath);
    const image = await jimp.read(input.imagePath);
    const nWidth = input.width === InputSize.auto ? jimp.AUTO : parseFloat(input.width) * getFactorForScreenType(input.screenType);
    const nHeight = input.height === InputSize.auto ? jimp.AUTO : parseFloat(input.height) * getFactorForScreenType(input.screenType);

    Logger.info(`resizing image for screen type ${input.screenType} <${nWidth === -1 ? 'auto' : nWidth}X${nHeight === -1 ? 'auto' : nHeight}>`);

    await image.resize(nWidth, nHeight).writeAsync(`${path.join(dirPath, imageNameWithExt)}`);
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
