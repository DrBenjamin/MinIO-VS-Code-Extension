import * as vscode from 'vscode';
import { FileDownloadService } from '../services/download.service';
import path = require('path');
import { handleFileDownloaded } from '../utils/handle-file-downloaded';

export const downloadLocalFile = async (resource: vscode.Uri) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path
    const fileName = path.basename(resourcePath);

    const imageLink = await vscode.window.withProgress(
        { title: 'Downloading file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let imageLink = '';
            try {
                const imageDownloadService = FileDownloadService.instance;
                await imageDownloadService.download(fileName);
                const config = vscode.workspace.getConfiguration('minio');
                const filePath= config.get<string>('minio.download.directory', '/Users/username/Downloads');
                imageLink = `${filePath}/${fileName}`;
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
    handleFileDownloaded(imageLink);
};