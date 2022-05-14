import * as ImageService from './image.service';
import * as fs from 'fs';
import * as path from 'path';
import { IOSScreenType, XIOSScreenType } from '../enums/ios-screen-type';
import * as changeCase from 'change-case';
import * as jimp from 'jimp';
import { InputSize } from '../enums/input-size';
import * as Logger from '../utils/logger';
import { appIconContents } from '../others/ios-app-icon-contents';
import * as _ from 'lodash';
import { iosImageContents } from '../others/ios-image-contents';

export const resizeImage = async (input: {
    imagePath: string,
    width: string,
    height: string,
    outputDir: string,
}) => {
    const imageNameWithoutExt = ImageService.getImageNameWithoutExtension(input.imagePath);
    const newImageName = changeCase.pascalCase(imageNameWithoutExt);
    const promises: Promise<void>[] = XIOSScreenType.values.map((screenType) => resizeImageForSpecificScreenType({
        ...input,
        screenType,
        imageNameWithoutExtension: newImageName,
    }));
    await Promise.all(promises);
    const newContent = _.cloneDeep(iosImageContents);
    newContent.images.forEach((img) => {
        img.filename = img.filename.replace('[IMAGE_NAME]', newImageName);
    });
    fs.writeFileSync(path.join(input.outputDir, 'Contents.json'), JSON.stringify(newContent, null, 2));
};

const resizeImageForSpecificScreenType = async (input: {
    imagePath: string,
    width: string,
    height: string,
    screenType: IOSScreenType,
    outputDir: string,
    imageNameWithoutExtension: string,
}) => {
    const newFileName = `${input.imageNameWithoutExtension}${input.screenType}${ImageService.getImageExtension(input.imagePath)}`;
    if (!fs.existsSync(input.outputDir)) {
        fs.mkdirSync(input.outputDir, {
            recursive: true,
        });
    }
    const image = await jimp.read(input.imagePath);
    const nWidth = input.width === InputSize.auto ? jimp.AUTO : parseFloat(input.width) * getFactorForScreenType(input.screenType);
    const nHeight = input.height === InputSize.auto ? jimp.AUTO : parseFloat(input.height) * getFactorForScreenType(input.screenType);

    Logger.info(`Resizing ios image for screen type ${input.screenType} <${nWidth === -1 ? 'auto' : nWidth}X${nHeight === -1 ? 'auto' : nHeight}>`);

    await image.resize(nWidth, nHeight).writeAsync(`${path.join(input.outputDir, newFileName)}`);
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

export const generateAppIcons = async (input: {
    imagePath: string,
    outputDir: string,
}): Promise<void> => {
    if (!fs.existsSync(input.outputDir)) {
        fs.mkdirSync(input.outputDir, {
            recursive: true,
        });
    }
    const promises = appIconContents.images.map(async (ic) => {
        const scale = +ic.scale.replace('x', '');
        const nSize = ic.size!.split('x');
        const image = await jimp.read(input.imagePath);
        Logger.info(`Resizing ios app icon for ${ic.filename}`);
        await image.resize(+nSize[0] * scale, +nSize[1] * scale)
            .writeAsync(path.join(input.outputDir, ic.filename));
    });
    await Promise.all(promises);
    fs.writeFileSync(path.join(input.outputDir, 'Contents.json'), JSON.stringify(appIconContents, null, 2));
};
