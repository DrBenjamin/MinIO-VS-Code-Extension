"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploadService = exports.ImageUploadService = void 0;
const path = require("path");
const minio_client_factory_service_1 = require("./minio-client-factory.service");
const minio_configuration_prodiver_service_1 = require("./minio-configuration-prodiver.service");
const mime = require("mime-types");
class ImageUploadService {
    static get instance() {
        if (!this._instance) {
            this._instance = new ImageUploadService();
        }
        return this._instance;
    }
    constructor() { }
    async upload(fileStream, fileName) {
        const client = minio_client_factory_service_1.MinioClientFactory.minioClient;
        const { bucketName, subDirectory, minioClientOption } = minio_configuration_prodiver_service_1.MinioConfigurationProvider.minioConfiguration;
        let filePath = `${subDirectory}/${fileName}`;
        filePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
        const fileExt = path.extname(fileName);
        await client.putObject(bucketName, filePath, fileStream, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': mime.contentType(fileExt),
        });
        const { port, endPoint } = minioClientOption;
        return `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${port == null || port === 80 || port === 443 ? '' : ':' + port}/${bucketName}${filePath
            .split('/')
            .map(x => encodeURI(x))
            .join('/')}`;
    }
}
exports.ImageUploadService = ImageUploadService;
exports.imageUploadService = ImageUploadService.instance;
//# sourceMappingURL=image-upload.service.js.map