import { Uri } from 'vscode';
import { handleFileCopyied } from '../utils/handle-file-copyied';
import { MinioConfigurationProvider } from '../services/minio-configuration-prodiver.service';

export const copyFileURL = async (resource: Uri) => {
    // Parse the resource path to get bucket and object info
    const pathParts = resource.path.substring(1).split('/');
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');
    
    const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
    const { port, endPoint } = minioClientOption;
    
    const fileLink = `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${ port == null || port === 80 || port === 443 ? '' : ':' + port }/${bucketName}/${objectName
        .split('/')
        .map((x: string) => encodeURI(x))
        .join('/')}`;
    
    handleFileCopyied(fileLink);
};