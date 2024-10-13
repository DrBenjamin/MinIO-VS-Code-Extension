import { MessageOptions, ProgressLocation, window } from 'vscode';
import * as fs from 'fs';
import { fileUploadService } from '../services/upload.service';
import path = require('path');
import { handleImageUploaded } from '../utils/handle-file-uploaded';

export const uploadLocalFile = async () => {
    const fileUri = ((await window.showOpenDialog({
        title: 'Select file',
        canSelectMany: false,
    })) ?? [])[0];
    if (!fileUri) {
        return;
    }
    const { fsPath: filePath } = fileUri;
    const fileName = path.basename(filePath);
    const imageLink = await window.withProgress(
        { title: 'Uploading file', location: ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let imageLink = '';
            try {
                imageLink = await fileUploadService.upload(fs.createReadStream(filePath), fileName);
            } catch (err) {
                window.showErrorMessage('Failed to upload file', {
                    detail: err instanceof Error ? err.message : JSON.stringify(err),
                    modal: true,
                } as MessageOptions);
            }

            p.report({ increment: 100 });
            return imageLink;
        }
    );
    handleImageUploaded(imageLink);
};
