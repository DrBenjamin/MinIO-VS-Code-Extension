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
     * Uploads a file stream to a specific bucket and path location.
     */
    async uploadToLocation(fileStream: Readable, fileName: string, bucketName: string, targetPath: string): Promise<string> {
        const client = MinioClientFactory.minioClient;
        const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        
        // Build object name from target path and filename
        const normalizedPath = targetPath ? targetPath.replace(/\/+$|\/+$/g, '') : '';
        const objectName = normalizedPath ? `${normalizedPath}/${fileName}` : fileName;
        const fileExt = path.extname(fileName);

        await client.putObject(bucketName, objectName, fileStream, {
            'Content-Type': mime.contentType(fileExt),
        });
        
        const { port, endPoint } = minioClientOption;
        // Build URL 
        return `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${ port == null || port === 80 || port === 443 ? '' : ':' + port }/${bucketName}/${objectName
            .split('/')
            .map(x => encodeURI(x))
            .join('/')}`;
    }
}

export const fileUploadService = FileUploadService.instance;
