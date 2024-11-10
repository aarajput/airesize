import {InputSize} from '../enums/input-size';

export interface IContent {
    images: IContentImage[];
    info: IContentInfo;
}

export interface IContentImage {
    filename: string;
    idiom: 'iphone' | 'ipad' | 'ios-marketing' | 'universal';
    scale: '1x' | '2x' | '3x';
    size?: string;
}

export interface IContentInfo {
    author: string;
    version: number;
}

export interface IGenerateAndroidAppIconOptions {
    input: {
        foregroundIconPath: string,
        foregroundIconPaddingFactor?: number,
        backgroundIconColor?: string,
        backgroundIconPath?: string,
    },
    output: {
        dir: string,
        foregroundIconName: string,
        backgroundIconOrColorName: string,
        mainIconName: string,
        colorFileName?: string,
    },
}

export interface IGenerateAndroidImagesOptions {
    input: {
        imagePath: string,
    },
    output: {
        width: number | InputSize.auto,
        height: number | InputSize.auto,
        dir: string,
        imageName: string,
    },
}

export interface IGenerateAndroidNotificationIcons {
    input: {
        imagePath: string,
    },
    output: {
        dir: string,
        imageName: string,
    },
}

export interface IGenerateIOSImages {
    input: {
        imagePath: string,
    },
    output: {
        width: number | InputSize.auto,
        height: number | InputSize.auto,
        dir: string,
        imageName: string,
    },
}

export interface IGenerateIOSAppIcons {
    input: {
        iconPath: string,
        iconColor?: string,
        iconPaddingFactor?: number,
    },
    output: {
        dir: string,
        iconName: string,
    },
}
