export enum AndroidScreenType {
    mdpi = 'mdpi',
    hdpi = 'hdpi',
    xhdpi = 'xhdpi',
    xxhdpi = 'xxhdpi',
    xxxhdpi = 'xxxhdpi',
}

export class XAndroidScreenType {

    static get values(): AndroidScreenType[] {
        return [
            AndroidScreenType.mdpi,
            AndroidScreenType.hdpi,
            AndroidScreenType.xhdpi,
            AndroidScreenType.xxhdpi,
            AndroidScreenType.xxxhdpi,
        ];
    }
}
