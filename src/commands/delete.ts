import * as vscode from 'vscode';
import { ImageDeleteService } from '../services/delete.service';
import { extractBucketAndObject } from '../utils/path-utils';

export const deleteLocalFile = async (resources: vscode.Uri | vscode.Uri[]) => {
    // Normalize to array
    const resourceArray = Array.isArray(resources) ? resources : [resources];
    
    // Filter out directories and only keep files, parse them
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
        const fileName = objectName.split('/').pop() || 'Unknown file';
        fileResources.push({
            uri: resource,
            bucket: bucketName,
            object: objectName,
            fileName
        });
    }
    
    if (fileResources.length === 0) {
        vscode.window.showErrorMessage('No valid files selected for deletion.');
        return;
    }
    
    // Confirm deletion
    const fileList = fileResources.length === 1
        ? `"${fileResources[0].fileName}"`
        : `${fileResources.length} files`;
    
    const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to delete ${fileList}?`,
        { modal: true },
        'Delete'
    );

    if (confirm !== 'Delete') {
        return;
    }

    // Delete files
    let successCount = 0;
    let failCount = 0;
    
    await vscode.window.withProgress(
        {
            title: `Deleting ${fileResources.length} file${fileResources.length > 1 ? 's' : ''}`,
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
                    const fileDeleteService = ImageDeleteService.instance;
                    await fileDeleteService.deleteFromLocation(bucketName, objectName);
                    successCount++;
                } catch (err) {
                    failCount++;
                    vscode.window.showErrorMessage(`Failed to delete ${fileName}`, {
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
            ? `Deleted ${successCount} file${successCount > 1 ? 's' : ''}, ${failCount} failed`
            : `Successfully deleted ${successCount} file${successCount > 1 ? 's' : ''}`;
        vscode.window.showInformationMessage(message);
    } else if (failCount > 0) {
        vscode.window.showErrorMessage(`Failed to delete all ${failCount} file${failCount > 1 ? 's' : ''}`);
    }
};