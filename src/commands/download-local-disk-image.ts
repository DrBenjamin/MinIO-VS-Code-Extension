import * as vscode from 'vscode';
import { ImageDownloadService } from '../services/image-download.service';
import path = require('path');

export const downloadLocalDiskImage = async (resource: vscode.Uri) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path
    const fileName = path.basename(resourcePath);

    const imageLink = await vscode.window.withProgress(
        { title: 'Downloading file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let imageLink = '';
            try {
                const imageDownloadService = ImageDownloadService.instance;
                await imageDownloadService.download(fileName);
                imageLink = `Downloaded ${fileName} successfully.`;
            } catch (err) {
                vscode.window.showErrorMessage('Failed to download file', {
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