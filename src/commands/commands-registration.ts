import { commands, window, Uri } from 'vscode';
import { AppContext } from '../utils/app-context';
import { uploadClipboardImage } from './upload-clipboard-image';
import { uploadLocalDiskImage } from './upload-local-disk-image';
import { downloadLocalDiskImage } from './download-local-disk-image';

export const registerCommands = () => {
    AppContext.extContext.subscriptions.push(
        commands.registerCommand(`${AppContext.extName}.upload-local-disk-image`, uploadLocalDiskImage),
        commands.registerCommand(`${AppContext.extName}.upload-clipboard-image`, uploadClipboardImage),
        commands.registerCommand(`${AppContext.extName}.download-local-disk-image`, (resource: Uri) => {
            console.log('Resource provided:', resource.fsPath);
            if (!resource) {
                window.showErrorMessage('No resource provided for download.');
                return;
            }
            downloadLocalDiskImage(resource);
        })
    );
};
