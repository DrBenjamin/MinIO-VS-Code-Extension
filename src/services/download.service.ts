import * as vscode from 'vscode';
import { MinioConfigurationProvider } from './minio-configuration-prodiver.service';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

export class FileDownloadService {
    private static _instance?: FileDownloadService;
    static get instance() {
        if (!this._instance) {
            this._instance = new FileDownloadService();
        }

        return this._instance;
    }

    private constructor() {}

    async downloadToPath(bucketName: string, objectName: string, localFilePath: string): Promise<void> {
        const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
        const client = new Minio.Client(minioClientOption);
        const fileStream = fs.createWriteStream(localFilePath);

        return new Promise((resolve, reject) => {
            let size = 0;
            client.getObject(bucketName, objectName, (err, dataStream) => {
                if (err) {
                    return reject(err);
                }
                
                dataStream.on('data', function (chunk) {
                    size += chunk.length;
                    fileStream.write(chunk);
                    console.log('Received ' + size);
                });
                
                dataStream.on('end', function () {
                    fileStream.end();
                    console.log('End. Total size = ' + size);
                    console.log('File downloaded to ' + localFilePath);
                    resolve();
                });
                
                dataStream.on('error', function (err) {
                    fileStream.end();
                    reject(err);
                });
            });
        });
    }
}

export const fileDownloadService = FileDownloadService.instance;