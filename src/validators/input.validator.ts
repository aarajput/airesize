import { InputSize } from '../enums/input-size';
import * as fs from 'fs';
import * as ImageService from '../service/image.service';

export const validateImagePath = (imagePath: string) => {
    if (!imagePath) {
        throw Error('Image path is required, please use command "airesize [IMAGE_PATH]"');
    }
    if (!fs.existsSync(imagePath)) {
        throw Error('Image not found');
    }
    if (!ImageService.isImage(imagePath)) {
        throw Error(`Only ${ImageService.allowedExtensions.join(', ')} extensions are allowed`);
    }
};

export const validateSize = (fieldName: string, input: string) => {
    if (!input) {
        throw Error(`${fieldName} is required`);
    }
    if (input === InputSize.auto) {
        return;
    }
    const num = parseFloat(input);
    if (isNaN(num)) {
        throw Error(`Only ${InputSize.auto} | number is allowed for ${fieldName}`);
    }
    if (num < 2) {
        throw Error(`${fieldName} should be greater than 1`);
    }
};

export const validateWidthAndHeight = (width: string, height: string) => {
    if (width === InputSize.auto && height === InputSize.auto) {
        throw Error('You can\'t use auto for both Width and Height at the same time');
    }
};
