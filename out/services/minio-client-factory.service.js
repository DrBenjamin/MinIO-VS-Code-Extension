"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioClientFactory = void 0;
const minio_1 = require("minio");
const minio_configuration_prodiver_service_1 = require("./minio-configuration-prodiver.service");
const validateClientOptions = ({ accessKey, secretKey, endPoint }) => {
    const errors = [];
    if (!accessKey) {
        errors.push('minio accessKey not configured');
    }
    if (!secretKey) {
        errors.push('minio secret key not configured');
    }
    if (!endPoint) {
        errors.push('minio endPoint not configured');
    }
    if (errors.length > 0) {
        throw Error(errors.join('\n'));
    }
};
class MinioClientFactory {
    static get minioClient() {
        const { minioClientOption } = minio_configuration_prodiver_service_1.MinioConfigurationProvider.minioConfiguration;
        validateClientOptions(minioClientOption);
        return new minio_1.Client(minioClientOption);
    }
}
exports.MinioClientFactory = MinioClientFactory;
//# sourceMappingURL=minio-client-factory.service.js.map