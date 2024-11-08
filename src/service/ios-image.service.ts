import * as ImageService from './image.service';
import * as fs from 'fs';
import * as path from 'path';
import {IOSScreenType, XIOSScreenType} from '../enums/ios-screen-type';
import * as sharp from 'sharp';
import {InputSize} from '../enums/input-size';
import * as Logger from '../utils/logger';
import {appIconContents} from '../others/ios-app-icon-contents';
import * as _ from 'lodash';
import {iosImageContents} from '../others/ios-image-contents';
import {IGenerateIOSAppIcons, IGenerateIOSImages} from '../others/interfaces';
import {Constants} from '../others/constants';

export const resizeImage = async (options: IGenerateIOSImages) => {
    const promises: Promise<void>[] = XIOSScreenType.values.map((screenType) => resizeImageForSpecificScreenType(options, screenType));
    await Promise.all(promises);
    const newContent = _.cloneDeep(iosImageContents);
    newContent.images.forEach((img) => {
        img.filename = img.filename.replace('[IMAGE_NAME]', options.output.imageName);
    });
    fs.writeFileSync(path.join(options.output.dir, 'Contents.json'), JSON.stringify(newContent, null, 2));
};

const resizeImageForSpecificScreenType = async (options: IGenerateIOSImages, screenType: IOSScreenType) => {
    let newFileExtension = ImageService.getImageExtension(options.input.imagePath);
    if (newFileExtension === '.svg') {
        newFileExtension = '.png';
    }
    const newFileName = `${options.output.imageName}${screenType}${newFileExtension}`;
    if (!fs.existsSync(options.output.dir)) {
        fs.mkdirSync(options.output.dir, {
            recursive: true,
        });
    }
    const nWidth = options.output.width === InputSize.auto ? undefined : options.output.width * getFactorForScreenType(screenType);
    const nHeight = options.output.height === InputSize.auto ? undefined : options.output.height * getFactorForScreenType(screenType);

    Logger.info(`Resizing ios image for screen type ${screenType} <${nWidth === undefined ? 'auto' : nWidth}X${nHeight === undefined ? 'auto' : nHeight}>`);
    await sharp(options.input.imagePath)
        .resize({
            width: nWidth,
            height: nHeight,
        })
        .toFile(path.join(options.output.dir, newFileName));
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

export const generateAppIcons = async (options: IGenerateIOSAppIcons): Promise<void> => {
    if (!fs.existsSync(options.output.dir)) {
        fs.mkdirSync(options.output.dir, {
            recursive: true,
        });
    }
    const newContent = _.cloneDeep(appIconContents);
    newContent.images.forEach((img) => {
        img.filename = img.filename.replace('[IMAGE_NAME]', options.output.iconName);
    });
    const promises = newContent.images.map(async (ic) => {
        const scale = +ic.scale.replace('x', '');
        const nSize = ic.size!.split('x');
        Logger.info(`Resizing ios app icon for ${ic.filename}`);
        const iWidth = +nSize[0] * scale;
        const iHeight = +nSize[1] * scale;
        if (options.input.iconColor) {
            await sharp(await sharp(Buffer.from(Constants.getSolidSVG(options.input.iconColor)))
                .resize({
                    width: iWidth,
                    height: iHeight,
                })
                .toBuffer())
                .composite([
                    {
                        input: await sharp(options.input.iconPath)
                            .resize({
                                width: Math.round(iWidth * 0.9),
                                height: Math.round(iHeight * 0.9),
                                fit: 'inside',
                            })
                            .toBuffer(),
                    },
                ])
                .toFile(path.join(options.output.dir, ic.filename));
        } else {
            await sharp(options.input.iconPath)
                .resize(
                    {
                        width: iWidth,
                        height: iHeight,
                    }
                )
                .toFile(path.join(options.output.dir, ic.filename))
        }
    });
    await Promise.all(promises);
    fs.writeFileSync(path.join(options.output.dir, 'Contents.json'), JSON.stringify(newContent, null, 2));
};
