import * as vscode from 'vscode';
import { MinioConfigurationProvider } from './minio-configuration-prodiver.service';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

export class ImageDownloadService {
    private static _instance?: ImageDownloadService;
    static get instance() {
        if (!this._instance) {
            this._instance = new ImageDownloadService();
        }

        return this._instance;
    }

    private constructor() {}

    async download(fileName: string): Promise<void> {
        const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        //const client = new Minio.Client(minioClientOption);
        const client = new Minio.Client({
            endPoint: '127.0.0.1',
            port: 9000,
            useSSL: false,
            accessKey: 'health',
            secretKey: 'NOentry#23'
        });
        const config = vscode.workspace.getConfiguration('minio');
        const bucketName = config.get<string>('minio.upload.bucketName', 'templategenerator');
        const filePath= config.get<string>('minio.download.directory', '/Users/ben/Downloads');
        const localFilePath = path.join(filePath, fileName);
        const fileStream = fs.createWriteStream(localFilePath);

        let size = 0;
        const dataStream = await client.getObject(bucketName, fileName);
        dataStream.on('data', function (chunk) {
            size += chunk.length;
            fileStream.write(chunk);
            console.log('Received ' + size);
        });
        dataStream.on('end', function () {
            fileStream.end();
            console.log('End. Total size = ' + size);
            console.log('File downloaded to ' + localFilePath);
        });
        dataStream.on('error', function (err) {
            fileStream.end();
            console.log(err);
        });
    }
}