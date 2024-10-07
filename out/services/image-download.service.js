"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageDownloadService = void 0;
const vscode = require("vscode");
const minio_configuration_prodiver_service_1 = require("./minio-configuration-prodiver.service");
const Minio = require("minio");
const fs = require("fs");
const path = require("path");
class ImageDownloadService {
    static get instance() {
        if (!this._instance) {
            this._instance = new ImageDownloadService();
        }
        return this._instance;
    }
    constructor() { }
    async download(fileName) {
        const { minioClientOption } = minio_configuration_prodiver_service_1.MinioConfigurationProvider.minioConfiguration;
        const client = new Minio.Client(minioClientOption);
        const config = vscode.workspace.getConfiguration('minio');
        const bucketName = config.get('minio.upload.bucketName', 'templategenerator');
        const filePath = config.get('minio.download.directory', '/Users/ben/Downloads');
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
exports.ImageDownloadService = ImageDownloadService;
//# sourceMappingURL=image-download.service.js.map