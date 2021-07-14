import * as Logger from './utils/logger';
import * as prompt from 'prompt';
import * as InputValidator from './validators/input.validator';
import * as AndroidImageResizer from './service/android-image.service';
import { InputSize } from './enums/input-size';

const start = async () => {
    const imagePath = process.argv[2];
    InputValidator.validateImagePath(imagePath);

    const size = await prompt.get([
        {
            properties: {
                width: {
                    description: `Width: {${InputSize.auto} | number}`,
                    default: 'auto',
                },
            },
        },
        {
            properties: {
                height: {
                    description: `Height: {${InputSize.auto} | number}`,
                    default: 'auto',
                },
            },
        },
    ]);
    const width = size.width.toString().toLowerCase();
    const height = size.height?.toString().toLowerCase();
    InputValidator.validateSize('Width', width as string);
    InputValidator.validateSize('Height', height as string);
    InputValidator.validateWidthAndHeight(width, height);

    await AndroidImageResizer.resizeImage({
        width,
        height,
        imagePath,
    });
};

start().then(() => {
    Logger.success('All image resized successfully');
})
    .catch((error) => {
        Logger.error(error.toString());
    });
