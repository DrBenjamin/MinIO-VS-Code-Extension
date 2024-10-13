"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadService = exports.FileUploadService = void 0;
const path = require("path");
const minio_client_factory_service_1 = require("./minio-client-factory.service");
const minio_configuration_prodiver_service_1 = require("./minio-configuration-prodiver.service");
const mime = require("mime-types");
class FileUploadService {
    static get instance() {
        if (!this._instance) {
            this._instance = new FileUploadService();
        }
        return this._instance;
    }
    constructor() { }
    async upload(fileStream, fileName) {
        const client = minio_client_factory_service_1.MinioClientFactory.minioClient;
        const { bucketName, minioClientOption } = minio_configuration_prodiver_service_1.MinioConfigurationProvider.minioConfiguration;
        const filePath = fileName.startsWith('/') ? fileName : `/${fileName}`;
        const fileExt = path.extname(fileName);
        await client.putObject(bucketName, filePath, fileStream, {
            'Content-Type': mime.contentType(fileExt),
        });
        const { port, endPoint } = minioClientOption;
        return `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${port == null || port === 80 || port === 443 ? '' : ':' + port}/${bucketName}${filePath
            .split('/')
            .map(x => encodeURI(x))
            .join('/')}`;
    }
}
exports.FileUploadService = FileUploadService;
exports.fileUploadService = FileUploadService.instance;
//# sourceMappingURL=upload.service.js.map