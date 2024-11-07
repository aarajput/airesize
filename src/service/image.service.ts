import * as path from 'path';

export const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg'];

export const isImage = (filePath: string) => {
    const extension = path.extname(filePath);
    return allowedExtensions.indexOf(extension) >= 0;
};

export const getImageNameWithoutExtension = (filePath: string) => {
    return path.basename(filePath, path.extname(filePath));
};

export const getImageExtension = (filePath: string) => {
    return path.extname(filePath);
};
