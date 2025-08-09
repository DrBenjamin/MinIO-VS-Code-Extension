import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';
import { extractBucketAndObject } from '../utils/path-utils';

export const deleteLocalFile = async (resource: vscode.Uri) => {
    // Parse the resource path to get bucket and object info
    const { bucket: bucketName, object: objectName } = extractBucketAndObject(resource);
    if (!bucketName || !objectName) {
        vscode.window.showErrorMessage('Failed to parse bucket/object from resource for deletion.');
        return;
    }
    const fileName = objectName.split('/').pop() || 'Unknown file';

    // Confirm deletion
    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete "${fileName}"?`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    const fileLink = await vscode.window.withProgress(
        { title: 'Deleting file', location: vscode.ProgressLocation.Notification },
        async p => {
            p.report({ increment: 10 });
            let fileLink = '';
            try {
                const fileDeleteService = ImageDeleteService.instance;
                await fileDeleteService.deleteFromLocation(bucketName, objectName);
                fileLink = `${fileName} successfully deleted.`;
            } catch (err) {
                vscode.window.showErrorMessage('Failed to delete file', {
                    detail: err instanceof Error ? err.message : JSON.stringify(err),
                    modal: true,
                } as vscode.MessageOptions);
            }

            p.report({ increment: 100 });
            return fileLink;
        }
    );
    vscode.window.showInformationMessage(fileLink);
};