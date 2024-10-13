"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageDeleteService = void 0;
const vscode = require("vscode");
const minio_configuration_prodiver_service_1 = require("./minio-configuration-prodiver.service");
const Minio = require("minio");
class ImageDeleteService {
    static get instance() {
        if (!this._instance) {
            this._instance = new ImageDeleteService();
        }
        return this._instance;
    }
    constructor() { }
    async delete(fileName) {
        const { minioClientOption } = minio_configuration_prodiver_service_1.MinioConfigurationProvider.minioConfiguration;
        const client = new Minio.Client(minioClientOption);
        const config = vscode.workspace.getConfiguration('minio');
        const bucketName = config.get('minio.upload.bucketName', 'templategenerator');
        await client.removeObject(bucketName, fileName);
    }
}
exports.ImageDeleteService = ImageDeleteService;
//# sourceMappingURL=delete.service.js.map