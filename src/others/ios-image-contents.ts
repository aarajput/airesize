import { IContent } from './interfaces';

export const iosImageContents: IContent = {
    images: [
        {
            filename: '[IMAGE_NAME]@1x.png',
            idiom: 'universal',
            scale: '1x'
        },
        {
            filename: '[IMAGE_NAME]@2x.png',
            idiom: 'universal',
            scale: '2x'
        },
        {
            filename: '[IMAGE_NAME]@3x.png',
            idiom: 'universal',
            scale: '3x'
        }
    ],
    info: {
        author: 'xcode',
        version: 1
    }
};
