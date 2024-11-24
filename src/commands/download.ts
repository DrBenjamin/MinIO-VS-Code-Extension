import * as vscode from 'vscode';
import { FileDownloadService } from '../services/download.service';
import path = require('path');
import { handleFileDownloaded } from '../utils/handle-file-downloaded';

export const downloadLocalFile = async (resource: vscode.Uri) => {
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
        { title: 'Downloading file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let fileLink = '';
            try {
                const fileDownloadService = FileDownloadService.instance;
                await fileDownloadService.download(fileURL, fileName);
                const config = vscode.workspace.getConfiguration('minio');
                const filePath= config.get<string>('minio.download.directory', '/Users/username/Downloads');
                fileLink = `${filePath}/${fileName}`;
            } catch (err) {
                vscode.window.showErrorMessage('Failed to download file', {
                    detail: err instanceof Error ? err.message : JSON.stringify(err),
                    modal: true,
                } as vscode.MessageOptions);
            }

            p.report({ increment: 100 });
            return fileLink;
        }
    );
    handleFileDownloaded(fileName);
};