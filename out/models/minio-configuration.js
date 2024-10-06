"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioConfiguration = void 0;
class MinioConfiguration {
    constructor(minioClientOption, bucketName, subDirectory) {
        this.minioClientOption = minioClientOption;
        this.bucketName = bucketName;
        this.subDirectory = subDirectory;
    }
}
exports.MinioConfiguration = MinioConfiguration;
//# sourceMappingURL=minio-configuration.js.map