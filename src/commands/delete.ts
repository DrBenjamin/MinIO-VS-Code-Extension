import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';
import path = require('path');

export const deleteLocalFile = async (resource: vscode.Uri) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path
    const incorrectPrefix = path.dirname(resourcePath);
    const folderCheck = incorrectPrefix.replace(/^\/\//, '');
    const stringParts = folderCheck.split('/');
    let folderName = stringParts.length > 1 ? stringParts[1] : '';
    if (folderName !== '') {
        folderName = `/${folderName}`;
    }
    const fileName = resourcePath.slice(incorrectPrefix.length).replace('/', '');
    const fileURL = `${folderName}/${fileName}`;

    const fileLink = await vscode.window.withProgress(
        { title: 'Deleting file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let fileLink = '';
            try {
                const fileDeleteService = ImageDeleteService.instance;
                await fileDeleteService.delete(fileURL);
                fileLink = `${fileName} successfully deleted.`;
            } catch (err) {
                vscode.window.showErrorMessage('Failed to delete file', {
                    detail: err instanceof Error ? err.message : JSON.stringify(err),
                    modal: true,
                } as vscode.MessageOptions);
            }

            p.report({ increment: 100 });
            return fileLink;
        }
    );
    vscode.window.showInformationMessage(fileLink);
};