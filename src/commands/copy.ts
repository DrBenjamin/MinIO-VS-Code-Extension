import { Uri, window } from 'vscode';
import { handleFileCopyied } from '../utils/handle-file-copyied';
import { MinioConfigurationProvider } from '../services/minio-configuration-prodiver.service';
import { extractBucketAndObject } from '../utils/path-utils';

export const copyFileURL = async (resources: Uri | Uri[]) => {
    // Normalize to array
    const resourceArray = Array.isArray(resources) ? resources : [resources];
    
    // Build URLs for all resources
    const fileLinks: string[] = [];
    const { minioClientOption } = MinioConfigurationProvider.minioConfiguration;
    const { port, endPoint } = minioClientOption;
    
    for (const resource of resourceArray) {
        const { bucket: bucketName, object: objectName } = extractBucketAndObject(resource);
        if (!bucketName || !objectName) {
            continue;
        }
        
        // Skip directories
        if (objectName.endsWith('/')) {
            continue;
        }
        
        const fileLink = `${minioClientOption.useSSL ? 'https' : 'http'}://${endPoint}${ port == null || port === 80 || port === 443 ? '' : ':' + port }/${bucketName}/${objectName
            .split('/')
            .map((x: string) => encodeURI(x))
            .join('/')}`;
        
        fileLinks.push(fileLink);
    }
    
    if (fileLinks.length === 0) {
        window.showWarningMessage('No valid files selected to copy links.');
        handleFileCopyied('');
        return;
    }
    
    // Join multiple links with newlines
    const linksToCopy = fileLinks.join('\n');
    handleFileCopyied(linksToCopy);
    
    // Show message
    if (fileLinks.length === 1) {
        window.showInformationMessage('File link copied to clipboard');
    } else {
        window.showInformationMessage(`${fileLinks.length} file links copied to clipboard`);
    }
};