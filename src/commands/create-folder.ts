import * as vscode from 'vscode';
import { MinIONode } from '../minio';
import { MinioClientFactory } from '../services/minio-client-factory.service';

function validateFolderPath(value: string): string | undefined {
    const folderPath = value.trim();

    if (!folderPath) {
        return 'Folder name is required.';
    }

    if (folderPath.startsWith('/') || folderPath.endsWith('/')) {
        return 'Folder name must not start or end with "/".';
    }

    if (folderPath.includes('\\')) {
        return 'Use "/" as separator instead of "\\".';
    }

    if (folderPath.split('/').some(segment => segment.trim().length === 0)) {
        return 'Folder path contains an empty segment.';
    }

    return undefined;
}

export async function createFolder(targetNode?: MinIONode): Promise<boolean> {
    if (!targetNode || !targetNode.isBucket) {
        vscode.window.showErrorMessage('Please select a bucket in the MinIO Explorer to create a folder.');
        return false;
    }

    const folderPathInput = await vscode.window.showInputBox({
        title: `Create Folder in ${targetNode.label}`,
        prompt: 'Enter folder name (or nested path)',
        placeHolder: 'my-folder or parent/my-folder',
        ignoreFocusOut: true,
        validateInput: validateFolderPath,
    });

    if (!folderPathInput) {
        return false;
    }

    const folderPath = folderPathInput.trim();
    const validationError = validateFolderPath(folderPath);
    if (validationError) {
        vscode.window.showErrorMessage(validationError);
        return false;
    }

    const folderMarkerObject = `${folderPath}/`;

    try {
        const client = MinioClientFactory.minioClient;
        await client.putObject(targetNode.label, folderMarkerObject, Buffer.from(''));
        vscode.window.showInformationMessage(`Folder "${folderPath}" created in bucket "${targetNode.label}".`);
        return true;
    } catch (error) {
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        vscode.window.showErrorMessage('Failed to create folder.', { detail } as vscode.MessageOptions);
        return false;
    }
}