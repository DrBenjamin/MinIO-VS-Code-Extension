import { MessageOptions, ProgressLocation, window, Uri, workspace } from 'vscode';
import * as fs from 'fs';
import { fileUploadService } from '../services/upload.service';
import path = require('path');
import { handleFileUploaded } from '../utils/handle-file-uploaded';
import { MinIONode } from '../minio';

export const uploadLocalFile = async (targetNode?: MinIONode) => {
    // Get the configured download directory to use as default upload location
    const config = workspace.getConfiguration('minio.minio.download');
    const downloadDirectory = config.get<string>('directory') || '';
    
    // Step 1: Select file(s) to upload
    const fileUris = (await window.showOpenDialog({
        title: 'Select file(s) to upload',
        canSelectMany: true,
        defaultUri: downloadDirectory ? Uri.file(downloadDirectory) : undefined
    })) ?? [];
    if (fileUris.length === 0) {
        return;
    }

    // Step 2: Determine target location
    let targetBucket = '';
    let targetPath = '';

    if (targetNode) {
        if (targetNode.isBucket) {
            // Uploading to root of bucket
            targetBucket = targetNode.label;
            targetPath = '';
        } else if (targetNode.isDirectory) {
            // Uploading to a folder
            const pathParts = targetNode.resource.path.substring(1).split('/');
            targetBucket = pathParts[0];
            targetPath = pathParts.slice(1).join('/');
        } else {
            // File selected - upload to its parent directory
            const pathParts = targetNode.resource.path.substring(1).split('/');
            targetBucket = pathParts[0];
            targetPath = pathParts.slice(1, -1).join('/');
        }
    } else {
        // No target selected - ask user to select bucket and path
        window.showErrorMessage('Please select a target bucket or folder in the MinIO Explorer');
        return;
    }

    // Step 3: Upload all selected files
    const fileCount = fileUris.length;
    let successCount = 0;
    let failCount = 0;
    const fileLinks: string[] = [];

    await window.withProgress(
        { 
            title: `Uploading ${fileCount} file${fileCount > 1 ? 's' : ''}`, 
            location: ProgressLocation.Notification 
        },
        async p => {
            for (let i = 0; i < fileUris.length; i++) {
                const fileUri = fileUris[i];
                const { fsPath: filePath } = fileUri;
                const fileName = path.basename(filePath);
                
                p.report({ 
                    increment: (100 / fileCount),
                    message: `${i + 1}/${fileCount}: ${fileName}`
                });

                try {
                    const fileLink = await fileUploadService.uploadToLocation(
                        fs.createReadStream(filePath), 
                        fileName, 
                        targetBucket, 
                        targetPath
                    );
                    fileLinks.push(fileLink);
                    successCount++;
                } catch (err) {
                    failCount++;
                    window.showErrorMessage(`Failed to upload ${fileName}`, {
                        detail: err instanceof Error ? err.message : JSON.stringify(err),
                        modal: false,
                    } as MessageOptions);
                }
            }
        }
    );

    // Step 4: Show summary and handle uploaded files
    if (successCount > 0) {
        const message = failCount > 0 
            ? `Uploaded ${successCount} file${successCount > 1 ? 's' : ''}, ${failCount} failed`
            : `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`;
        window.showInformationMessage(message);
        
        // Handle the first uploaded file link (for backward compatibility)
        if (fileLinks.length > 0) {
            handleFileUploaded(fileLinks[0]);
        }
    } else if (failCount > 0) {
        window.showErrorMessage(`Failed to upload all ${failCount} file${failCount > 1 ? 's' : ''}`);
    }
};
