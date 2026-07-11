import * as vscode from 'vscode';
import { MinioConfigurationProvider } from './minio-configuration-prodiver.service';
import * as Minio from 'minio';

export class ImageDeleteService {
    private static _instance?: ImageDeleteService;
    static get instance() {
        if (!this._instance) {
            this._instance = new ImageDeleteService();
        }

        return this._instance;
    }

    private constructor() {}

    async deleteFromLocation(bucketName: string, objectName: string): Promise<void> {
        const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        const client = new Minio.Client(minioClientOption);

        await client.removeObject(bucketName, objectName);
    }

    /**
     * Deletes a bucket and all its contents.
     * @param bucketName The name of the bucket to delete.
     */
    async deleteBucket(bucketName: string): Promise<void> {
        const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        const client = new Minio.Client(minioClientOption);

        // List all objects in the bucket to clear it first
        const deletions: Promise<void>[] = [];
        const objectsStream = client.listObjectsV2(bucketName, '', true);

        await new Promise<void>((resolve, reject) => {
            objectsStream.on('data', (obj: any) => {
                if (obj.objectName) {
                    deletions.push(
                        client.removeObject(bucketName, obj.objectName).catch(() => {
                            // Ignore errors on individual objects to ensure we try to delete as much as possible
                        })
                    );
                }
            });

            objectsStream.on('error', reject);

            objectsStream.on('end', async () => {
                try {
                    await Promise.all(deletions);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        await client.removeBucket(bucketName);
    }

    /**
     * Deletes a folder (prefix) within a bucket and all its contents.
     * @param bucketName The name of the bucket.
     * @param prefix The directory path to delete.
     */
    async deleteFolder(bucketName: string, prefix: string): Promise<void> {
        const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        const client = new Minio.Client(minioClientOption);

        let folderPrefix = prefix;
        if (folderPrefix && !folderPrefix.endsWith('/')) {
            folderPrefix += '/';
        }

        const objectsStream = client.listObjectsV2(bucketName, folderPrefix, true);

        await new Promise<void>((resolve, reject) => {
            let hasContent = false;

            objectsStream.on('data', (obj: any) => {
                if (obj.objectName && obj.objectName !== folderPrefix) {
                    hasContent = true;
                }
            });

            objectsStream.on('error', reject);

            objectsStream.on('end', () => {
                if (hasContent) {
                    reject(new Error(`Folder '${prefix}' is not empty.`));
                    return;
                }

                resolve();
            });
        });

        // Delete a potential folder-marker object (e.g. "folder/")
        if (folderPrefix) {
            try {
                await client.removeObject(bucketName, folderPrefix);
            } catch {
                // Ignore if no folder-marker object exists
            }
        }
    }
}
