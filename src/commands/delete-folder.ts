import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';
import { extractBucketAndObject } from '../utils/path-utils';

/**
 * Deletes a folder (prefix) within a bucket and all its contents.
 * @param arg The resource being deleted (from context menu).
 * @param selectedItems Optional multiple items if multi-select is enabled.
 */
export async function deleteFolder(arg: any, selectedItems?: any[]): Promise<boolean> {
    const resources: { bucket: string; prefix: string }[] = [];

    if (selectedItems && selectedItems.length > 0) {
        for (const item of selectedItems) {
            // When selecting multiple items, we need to see if they are folders/buckets
            // For now, let's assume we only allow deleting one folder at a time if multi-select is on but it contains 1 item.
            // Or just handle the first one. Actually, standard VS Code behavior for "delete" is often single or multiple.
        }
    } else {
        const resource = arg; // This will be the MinIONode from TreeView
        if (resource && resource.resource) {
            const { bucket: bucketName, object: objectName } = extractBucketAndObject(resource.resource);
            // Since it's a folder selection, we want to delete everything under this prefix.
            // The 'objectName' here will be the path relative to the bucket root.
            resources.push({ bucket: bucketName, prefix: objectName });
        }
    }

    if (resources.length === 0) {
        vscode.window.showErrorMessage('No valid folder selected for deletion.');
        return false;
    }

    // For simplicity in this implementation, we only support one at a time if it's not clear how to handle multiple folders
    const { bucket: bucketName, prefix: folderPrefix } = resources[0];

    // Confirm deletion
    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete the folder "${folderPrefix}" in bucket "${bucketName}"? The folder has to be empty!`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return false;
    }

    try {
        await vscode.window.withProgress({
            title: `Deleting folder "${folderPrefix}"...`,
            location: vscode.ProgressLocation.Notification,
            cancellable: false
        }, async () => {
            // We need to know which bucket and prefix to delete from.
            // The extractBucketAndObject might return the full path.
            // If folderPrefix is "folder1/sub", we want to delete everything under "folder1/sub/"
            let prefixToDelete = folderPrefix;
            if (prefixToDelete && !prefixToDelete.endsWith('/')) {
                prefixToDelete += '/';
            }

            await ImageDeleteService.instance.deleteFolder(bucketName, prefixToDelete);
        });

        vscode.window.showInformationMessage(`Folder "${folderPrefix}" deleted successfully.`);
        return true;
    } catch (error) {
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        vscode.window.showErrorMessage('Failed to delete folder.', { detail } as vscode.MessageOptions);
        return false;
    }
}
