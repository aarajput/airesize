import * as Logger from './utils/logger';
import * as prompt from 'prompt';
import * as InputValidator from './validators/input.validator';
import * as AndroidImageResizer from './service/android-image.service';
import * as IOSImageResizer from './service/ios-image.service';
import * as ImageService from './service/image.service';
import * as yargs from 'yargs';
import * as path from 'path';
import { InputSize } from './enums/input-size';
import { hideBin } from 'yargs/helpers';

const start = async () => {
    const argv = await yargs(hideBin(process.argv)).option('version', {
        alias: 'v'
    }).option('android', {
        alias: 'a'
    })
        .argv;
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

    if (argv.android || (!argv.android && !argv.ios)) {
        await AndroidImageResizer.resizeImage({
            width,
            height,
            imagePath,
        });
    }

    if (argv.ios || (!argv.android && !argv.ios)) {
        await IOSImageResizer.resizeImage({
            width,
            height,
            imagePath,
        });
    }
    const outputDir = path.dirname(path.resolve(imagePath));
    return `All image resized successfully. You can find them in ${path.join(outputDir, ImageService.getImageNameWithoutExtension(imagePath))}`;
};

start().then((message) => {
    Logger.success(message);
})
    .catch((error) => {
        Logger.error(error.toString());
    });
