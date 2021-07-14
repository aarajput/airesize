export enum IOSScreenType {
    one = '@1x',
    two = '@2x',
    three = '@3x',
}

export class XIOSScreenType {
    static get values(): IOSScreenType[] {
        return [
            IOSScreenType.one,
            IOSScreenType.two,
            IOSScreenType.three,
        ];
    };
}
