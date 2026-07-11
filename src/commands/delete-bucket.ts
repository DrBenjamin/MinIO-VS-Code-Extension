import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';

/**
 * Deletes a bucket, ensuring it is empty first.
 * @param bucketOrItem The name of the bucket to delete, or a TreeItem (optional).
 */
export async function deleteBucket(bucketOrItem?: any): Promise<boolean> {
    let nameToDelete: string | undefined;

    if (typeof bucketOrItem === 'string') {
        nameToDelete = bucketOrItem;
    } else if (bucketOrItem) {
        nameToDelete = bucketOrItem.bucketName
            ?? bucketOrItem.name
            ?? bucketOrItem.label;
    }

    if (!nameToDelete) {
        const result = await vscode.window.showInputBox({
            title: 'Delete Bucket',
            prompt: 'Enter the name of the bucket to delete',
            placeHolder: 'my-bucket',
            validateInput: (value) => {
                if (value.length < 3 || value.length > 63) {
                    return 'Bucket name must be between 3 and 63 characters.';
                }
                return null;
            }
        });
        if (!result) {
            return false;
        }
        nameToDelete = result;
    }

    const confirm = await vscode.window.showWarningMessage(
        `You can only delete Bucket "${nameToDelete}" if it is empty, otherwise it will fail! Are you sure you want to delete this bucket?`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return false;
    }

    try {
        await vscode.window.withProgress({
            title: `Deleting bucket "${nameToDelete}"...`,
            location: vscode.ProgressLocation.Notification,
            cancellable: false
        }, async () => {
            await ImageDeleteService.instance.deleteBucket(nameToDelete!);
        });

        vscode.window.showInformationMessage(`Bucket "${nameToDelete}" deleted successfully.`);
        return true;
    } catch (error) {
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        vscode.window.showErrorMessage('Failed to delete bucket.', { detail } as vscode.MessageOptions);
        return false;
    }
}
