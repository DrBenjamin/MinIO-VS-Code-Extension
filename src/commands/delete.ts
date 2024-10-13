import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';
import path = require('path');

export const deleteLocalFile = async (resource: vscode.Uri) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path
    const fileName = path.basename(resourcePath);

    const imageLink = await vscode.window.withProgress(
        { title: 'Deleting file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let imageLink = '';
            try {
                const imageDeleteService = ImageDeleteService.instance;
                await imageDeleteService.delete(fileName);
                imageLink = `${fileName} successfully deleted.`;
            } catch (err) {
                vscode.window.showErrorMessage('Failed to delete file', {
                    detail: err instanceof Error ? err.message : JSON.stringify(err),
                    modal: true,
                } as vscode.MessageOptions);
            }

            p.report({ increment: 100 });
            return imageLink;
        }
    );
    vscode.window.showInformationMessage(imageLink);
};