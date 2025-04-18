import path = require('path');
import { Readable } from 'stream';
import { MinioClientFactory } from './minio-client-factory.service';
import { MinioConfigurationProvider } from './minio-configuration-prodiver.service';
import * as mime from 'mime-types';

export class FileUploadService {
    private static _instance?: FileUploadService;
    static get instance() {
        if (!this._instance) {
            this._instance = new FileUploadService();
        }

        return this._instance;
    }

    private constructor() {}

    /**
     * Uploads a file stream to MinIO, placing it into the configured subdirectory if set.
     */
    async upload(fileStream: Readable, fileName: string): Promise<string> {
        const client = MinioClientFactory.minioClient;
        const { bucketName, minioClientOption, subDirectory } = MinioConfigurationProvider.minioConfiguration;
        // Normalize subdirectory and build object name
        const normalizedSubDir = subDirectory ? subDirectory.replace(/\/+$|\/+$/g, '') : '';
        const objectName = normalizedSubDir ? `/${normalizedSubDir}/${fileName}` : `/${fileName}`;
        const fileExt = path.extname(fileName);

        await client.putObject(bucketName, objectName, fileStream, {
            'Content-Type': mime.contentType(fileExt),
        });
        const { port, endPoint } = minioClientOption;
        // Build URL using the same objectName
        return `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${ port == null || port === 80 || port === 443 ? '' : ':' + port }/${bucketName}${objectName
            .split('/')
            .map(x => encodeURI(x))
            .join('/')}`;
    }
}

export const fileUploadService = FileUploadService.instance;
