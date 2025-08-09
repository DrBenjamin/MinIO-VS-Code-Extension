import * as vscode from 'vscode';
import { FileDownloadService } from '../services/download.service';
import path = require('path');
import { handleFileDownloaded } from '../utils/handle-file-downloaded';

export const downloadLocalFile = async (resource: vscode.Uri) => {
    // Parse the resource path to get bucket and object info
    const pathParts = resource.path.substring(1).split('/');
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
    const fileName = path.basename(objectName);

    // Ask user where to save the file
    const saveUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(fileName),
        title: 'Save file as',
        saveLabel: 'Save'
    });

    if (!saveUri) {
        return; // User cancelled
    }

    const fileLink = await vscode.window.withProgress(
        { title: 'Downloading file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let fileLink = '';
            try {
                const fileDownloadService = FileDownloadService.instance;
                await fileDownloadService.downloadToPath(bucketName, objectName, saveUri.fsPath);
                fileLink = saveUri.fsPath;
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