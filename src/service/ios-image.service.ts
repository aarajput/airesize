import * as ImageService from './image.service';
import * as fs from 'fs';
import * as path from 'path';
import { IOSScreenType, XIOSScreenType } from '../enums/ios-screen-type';
import * as changeCase from 'change-case';
import * as jimp from 'jimp';
import { InputSize } from '../enums/input-size';
import * as Logger from '../utils/logger';

export const resizeImage = async (input: {
    imagePath: string,
    width: string,
    height: string,
}) => {
    const baseDir = ImageService.getImageNameWithoutExtension(input.imagePath);
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir);
    }
    const subBaseDir = path.join(baseDir, 'ios');
    if (!fs.existsSync(subBaseDir)) {
        fs.mkdirSync(subBaseDir);
    }
    const promises: Promise<any>[] = [];
    XIOSScreenType.values.forEach((screenType) => {
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
    screenType: IOSScreenType,
}) => {
    const imageNameWithoutExt = ImageService.getImageNameWithoutExtension(input.imagePath);
    const newImageName = changeCase.pascalCase(imageNameWithoutExt);
    const newFileName = `${newImageName}${input.screenType}${ImageService.getImageExtension(input.imagePath)}`;
    const dirPath = path.join(ImageService.getImageNameWithoutExtension(input.imagePath), 'ios');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    const image = await jimp.read(input.imagePath);
    const nWidth = input.width === InputSize.auto ? jimp.AUTO : parseFloat(input.width) * getFactorForScreenType(input.screenType);
    const nHeight = input.height === InputSize.auto ? jimp.AUTO : parseFloat(input.height) * getFactorForScreenType(input.screenType);

    Logger.info(`Resizing ios image for screen type ${input.screenType} <${nWidth === -1 ? 'auto' : nWidth}X${nHeight === -1 ? 'auto' : nHeight}>`);

    await image.resize(nWidth, nHeight).writeAsync(`${path.join(dirPath, newFileName)}`);
};


const getFactorForScreenType = (screenType: IOSScreenType): number => {
    switch (screenType) {
        case IOSScreenType.one:
            return 1;
        case IOSScreenType.two:
            return 2;
        case IOSScreenType.three:
            return 3;
    }
};
