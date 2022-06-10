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
        backgroundIconColor: string,
    },
    output: {
        dir: string,
        foregroundIconName: string,
        roundIconName: string,
        colorFileName: string,
    },
}
