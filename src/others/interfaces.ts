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

