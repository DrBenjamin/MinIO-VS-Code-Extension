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

    async upload(fileStream: Readable, fileName: string): Promise<string> {
        const client = MinioClientFactory.minioClient;
        const { bucketName, minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        const filePath = fileName.startsWith('/') ? fileName : `/${fileName}`;
        const fileExt = path.extname(fileName);

        await client.putObject(bucketName, filePath, fileStream, {
            'Content-Type': mime.contentType(fileExt),
        });
        const { port, endPoint } = minioClientOption;
        return `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${ port == null || port === 80 || port === 443 ? '' : ':' + port }/${bucketName}${filePath
            .split('/')
            .map(x => encodeURI(x))
            .join('/')}`;
    }
}

export const fileUploadService = FileUploadService.instance;
