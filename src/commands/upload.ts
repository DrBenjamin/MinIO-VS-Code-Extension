import { MessageOptions, ProgressLocation, window } from 'vscode';
import * as fs from 'fs';
import { fileUploadService } from '../services/upload.service';
import path = require('path');
import { handleFileUploaded } from '../utils/handle-file-uploaded';
import { MinIONode } from '../minio';
import { extractBucketAndObject } from '../utils/path-utils';

export const uploadLocalFile = async (targetNode?: MinIONode) => {
    // Step 1: Select file(s) to upload
    const fileUris = (await window.showOpenDialog({
        title: 'Select file(s) to upload',
        canSelectMany: true
    })) ?? [];
    if (fileUris.length === 0) {
        return;
    }

    // Step 2: Determine target location
    let targetBucket = '';
    let targetPath = '';

    if (targetNode) {
        if (targetNode.isBucket) {
            // Bucket uploads are always forced to bucket root.
            targetBucket = targetNode.label;
            targetPath = '';
        } else if (targetNode.isDirectory) {
            // Uploading to a folder
            const { bucket, object } = extractBucketAndObject(targetNode.resource);
            targetBucket = bucket;
            targetPath = object.replace(/\/+$/, '');
        } else {
            // File selected - upload to its parent directory
            const { bucket, object } = extractBucketAndObject(targetNode.resource);
            targetBucket = bucket;
            const parentDir = object.split('/').slice(0, -1).join('/');
            targetPath = parentDir.replace(/\/+$/, '');
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
