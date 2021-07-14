export enum AndroidScreenType {
    mdpi = 'drawable-mdpi',
    hdpi = 'drawable-hdpi',
    xhdpi = 'drawable-xhdpi',
    xxhdpi = 'drawable-xxhdpi',
    xxxhdpi = 'drawable-xxxhdpi',
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
