import { ClientOptions } from 'minio';

export class MinioConfiguration {
    constructor(public minioClientOption: ClientOptions) {}
}
