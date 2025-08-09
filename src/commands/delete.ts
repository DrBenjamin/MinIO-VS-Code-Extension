import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';

export const deleteLocalFile = async (resource: vscode.Uri) => {
    // Parse the resource path to get bucket and object info
    const pathParts = resource.path.substring(1).split('/');
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
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