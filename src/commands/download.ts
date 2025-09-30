import * as vscode from 'vscode';
import { FileDownloadService } from '../services/download.service';
import { extractBucketAndObject } from '../utils/path-utils';
import path = require('path');
import { handleFileDownloaded } from '../utils/handle-file-downloaded';

export const downloadLocalFile = async (resources: vscode.Uri | vscode.Uri[]) => {
    // Normalize to array
    const resourceArray = Array.isArray(resources) ? resources : [resources];
    
    // Filter out directories and only keep files
    const fileResources: Array<{uri: vscode.Uri, bucket: string, object: string, fileName: string}> = [];
    
    for (const resource of resourceArray) {
        const { bucket: bucketName, object: objectName } = extractBucketAndObject(resource);
        if (!bucketName || !objectName) {
            vscode.window.showWarningMessage(`Skipping invalid resource: ${resource.toString()}`);
            continue;
        }
        // Skip directories (they typically end with /)
        if (objectName.endsWith('/')) {
            continue;
        }
        fileResources.push({
            uri: resource,
            bucket: bucketName,
            object: objectName,
            fileName: path.basename(objectName)
        });
    }
    
    if (fileResources.length === 0) {
        vscode.window.showErrorMessage('No valid files selected for download.');
        return;
    }
    
    // Get the configured download directory
    const config = vscode.workspace.getConfiguration('minio.minio.download');
    const downloadDirectory = config.get<string>('directory') || '';
    
    // Single file download - use save dialog
    if (fileResources.length === 1) {
        const { bucket: bucketName, object: objectName, fileName } = fileResources[0];
        
        // Build the default save path
        const defaultPath = downloadDirectory 
            ? path.join(downloadDirectory, fileName)
            : fileName;

        // Ask user where to save the file
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultPath),
            title: 'Save file as',
            saveLabel: 'Save'
        });

        if (!saveUri) {
            return; // User cancelled
        }

        await vscode.window.withProgress(
            { title: 'Downloading file', location: vscode.ProgressLocation.Notification },
            async p => {
                p.report({ increment: 10 });
                try {
                    const fileDownloadService = FileDownloadService.instance;
                    await fileDownloadService.downloadToPath(bucketName, objectName, saveUri.fsPath);
                } catch (err) {
                    vscode.window.showErrorMessage('Failed to download file', {
                        detail: err instanceof Error ? err.message : JSON.stringify(err),
                        modal: true,
                    } as vscode.MessageOptions);
                }
                p.report({ increment: 100 });
            }
        );
        handleFileDownloaded(fileName);
    } else {
        // Multiple files - use open folder dialog
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Download Folder',
            title: `Select folder to download ${fileResources.length} files`,
            defaultUri: downloadDirectory ? vscode.Uri.file(downloadDirectory) : undefined
        });
        
        if (!folderUri || folderUri.length === 0) {
            return; // User cancelled
        }
        
        const targetFolder = folderUri[0].fsPath;
        let successCount = 0;
        let failCount = 0;
        
        await vscode.window.withProgress(
            {
                title: `Downloading ${fileResources.length} file${fileResources.length > 1 ? 's' : ''}`,
                location: vscode.ProgressLocation.Notification
            },
            async p => {
                for (let i = 0; i < fileResources.length; i++) {
                    const { bucket: bucketName, object: objectName, fileName } = fileResources[i];
                    
                    p.report({
                        increment: (100 / fileResources.length),
                        message: `${i + 1}/${fileResources.length}: ${fileName}`
                    });
                    
                    try {
                        const localFilePath = path.join(targetFolder, fileName);
                        const fileDownloadService = FileDownloadService.instance;
                        await fileDownloadService.downloadToPath(bucketName, objectName, localFilePath);
                        successCount++;
                    } catch (err) {
                        failCount++;
                        vscode.window.showErrorMessage(`Failed to download ${fileName}`, {
                            detail: err instanceof Error ? err.message : JSON.stringify(err),
                            modal: false,
                        } as vscode.MessageOptions);
                    }
                }
            }
        );
        
        // Show summary
        if (successCount > 0) {
            const message = failCount > 0
                ? `Downloaded ${successCount} file${successCount > 1 ? 's' : ''}, ${failCount} failed`
                : `Successfully downloaded ${successCount} file${successCount > 1 ? 's' : ''}`;
            vscode.window.showInformationMessage(message);
        } else if (failCount > 0) {
            vscode.window.showErrorMessage(`Failed to download all ${failCount} file${failCount > 1 ? 's' : ''}`);
        }
    }
};