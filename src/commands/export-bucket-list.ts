import * as vscode from 'vscode';
import { MinioClientFactory } from '../services/minio-client-factory.service';
import { buildBucketListCsv } from '../utils/bucket-list-csv';

export async function exportBucketList(): Promise<void> {
    try {
        const client = MinioClientFactory.minioClient;
        const buckets = await client.listBuckets();
        const csvContent = buildBucketListCsv(buckets.map((bucket) => ({ name: bucket.name })));

        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('bucket-list.csv'),
            filters: {
                'CSV Files': ['csv'],
                'All Files': ['*']
            },
            saveLabel: 'Export bucket list'
        });

        if (!saveUri) {
            return;
        }

        await vscode.workspace.fs.writeFile(saveUri, Buffer.from(csvContent, 'utf8'));
        vscode.window.showInformationMessage(`Exported ${buckets.length} bucket(s) to ${saveUri.fsPath}`);
    } catch (error) {
        const detail = error instanceof Error ? error.message : JSON.stringify(error);
        vscode.window.showErrorMessage('Failed to export bucket list.', { detail } as vscode.MessageOptions);
    }
}
