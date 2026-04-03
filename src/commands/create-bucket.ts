import * as vscode from 'vscode';
import { MinioClientFactory } from '../services/minio-client-factory.service';

const BUCKET_NAME_PATTERN = /^(?!\d+\.\d+\.\d+\.\d+$)(?!-)(?!.*\.-)(?!.*-\.)(?!.*\.\.)(?!.*-$)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

function validateBucketName(value: string): string | undefined {
    const bucketName = value.trim();

    if (bucketName.length === 0) {
        return 'Bucket name is required.';
    }

    if (bucketName.length < 3 || bucketName.length > 63) {
        return 'Bucket name must be between 3 and 63 characters.';
    }

    if (!BUCKET_NAME_PATTERN.test(bucketName)) {
        return 'Use lowercase letters, numbers, dots, and hyphens only.';
    }

    return undefined;
}

export async function createBucket(): Promise<boolean> {
    const bucketNameInput = await vscode.window.showInputBox({
        title: 'Create MinIO Bucket',
        prompt: 'Enter a unique bucket name',
        placeHolder: 'my-new-bucket',
        ignoreFocusOut: true,
        validateInput: validateBucketName
    });

    if (!bucketNameInput) {
        return false;
    }

    const bucketName = bucketNameInput.trim();
    const validationError = validateBucketName(bucketName);
    if (validationError) {
        vscode.window.showErrorMessage(validationError);
        return false;
    }

    try {
        const client = MinioClientFactory.minioClient;
        const exists = await client.bucketExists(bucketName);

        if (exists) {
            vscode.window.showWarningMessage(`Bucket "${bucketName}" already exists.`);
            return false;
        }

        await client.makeBucket(bucketName);
        vscode.window.showInformationMessage(`Bucket "${bucketName}" created.`);
        return true;
    } catch (error) {
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        vscode.window.showErrorMessage('Failed to create bucket.', { detail } as vscode.MessageOptions);
        return false;
    }
}
