import { MessageOptions, ProgressLocation, window, Uri } from 'vscode';
import * as fs from 'fs';
import { fileUploadService } from '../services/upload.service';
import path = require('path');
import { handleFileUploaded } from '../utils/handle-file-uploaded';
import { MinIONode } from '../minio';

export const uploadLocalFile = async (targetNode?: MinIONode) => {
    // Step 1: Select file to upload
    const fileUri = ((await window.showOpenDialog({
        title: 'Select file to upload',
        canSelectMany: false,
    })) ?? [])[0];
    if (!fileUri) {
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

    const { fsPath: filePath } = fileUri;
    const fileName = path.basename(filePath);

    const fileLink = await window.withProgress(
        { title: 'Uploading file', location: ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let fileLink = '';
            try {
                fileLink = await fileUploadService.uploadToLocation(
                    fs.createReadStream(filePath), 
                    fileName, 
                    targetBucket, 
                    targetPath
                );
            } catch (err) {
                window.showErrorMessage('Failed to upload file', {
                    detail: err instanceof Error ? err.message : JSON.stringify(err),
                    modal: true,
                } as MessageOptions);
            }

            p.report({ increment: 100 });
            return fileLink;
        }
    );
    handleFileUploaded(fileLink);
};
