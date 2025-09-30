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
}