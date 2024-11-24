import { Uri } from 'vscode';
import path = require('path');
import { handleFileCopyied } from '../utils/handle-file-copyied';
import { MinioConfigurationProvider } from '../services/minio-configuration-prodiver.service';

export const copyFileURL = async (resource: Uri) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path
    const incorrectPrefix = path.dirname(resourcePath);
    const folderCheck = incorrectPrefix.replace(/^\/\//, '');
    const stringParts = folderCheck.split('/');
    let folderName = stringParts.length > 1 ? stringParts[1] : '';
    if (folderName !== '') {
        folderName = `/${folderName}`;
    }
    const fileName = resourcePath.slice(incorrectPrefix.length).replace('/', '');
    const fileURL = `${folderName}/${fileName}`;
    const { bucketName, minioClientOption } = MinioConfigurationProvider.minioConfiguration;
    const { port, endPoint } = minioClientOption;
    const fileLink = `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${ port == null || port === 80 || port === 443 ? '' : ':' + port }/${bucketName}${fileURL
            .split('/')
            .map((x: string) => encodeURI(x))
            .join('/')}`;
    handleFileCopyied(fileLink);
};