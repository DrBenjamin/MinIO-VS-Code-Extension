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
        const objectsStream = client.listObjectsV2(bucketName, '', true);
        await new Promise((resolve, reject) => {
            objectsStream.on('data', async (obj: any) => {
                if (obj.objectName) {
                    try {
                        await client.removeObject(bucketName, obj.objectName);
                    } catch (e) {
                        // Ignore errors on individual objects to ensure we try to delete as much as possible
                    }
                }
            });
            objectsStream.on('error', reject);
            objectsStream.on('end', resolve);
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

        // Ensure the prefix ends with / for clean matching unless it's empty
        let folderPrefix = prefix;
        if (folderPrefix && !folderPrefix.endsWith('/')) {
            folderPrefix += '/';
        }

        const objectsStream = client.listObjectsV2(bucketName, folderPrefix, true);
        await new Promise((resolve, reject) => {
            objectsStream.on('data', async (obj: any) => {
                if (obj.objectName) {
                    try {
                        await client.removeObject(bucketName, obj.objectName);
                    } catch (e) {
                        // Ignore errors on individual objects to ensure we try to delete as much as possible
                    }
                }
            });
            objectsStream.on('error', reject);
            objectsStream.on('end', resolve);
        });
    }
}
