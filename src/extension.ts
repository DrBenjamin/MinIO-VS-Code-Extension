import { ExtensionContext, workspace, commands, window, Uri } from 'vscode';
import { MinioConfigurationProvider } from './services/minio-configuration-prodiver.service';
import { AppContext } from './utils/app-context';
import { MinIOModel, MinIOTreeDataProvider } from './minio';
import { uploadLocalFile } from './commands/upload';
import { downloadLocalFile } from './commands/download';
import { deleteLocalFile } from './commands/delete';

export function activate(context: ExtensionContext) {
    AppContext.init(context);
    MinioConfigurationProvider.migrateOld();

    // Konfigurationseinstellungen lesen
    const config = workspace.getConfiguration('minio');
    const serverAddress = config.get<string>('minio.server.address', '127.0.0.1');
    const accessKey = config.get<string>('minio.credential.accessKey', 'user');
    const secretKey = config.get<string>('minio.credential.secretKey', 'password');
    const bucketName = config.get<string>('minio.upload.bucketName', 'bucket');

    // MinIO Explorer
    const ftpModel = new MinIOModel(serverAddress, accessKey, secretKey, bucketName);
    const ftpTreeDataProvider = new MinIOTreeDataProvider(ftpModel);
    window.registerTreeDataProvider('MinIOExplorer', ftpTreeDataProvider);
    commands.registerCommand('MinIOExplorer.refresh', () => ftpTreeDataProvider.refresh());
    commands.registerCommand('MinIOExplorer.openMinIOResource', resource => {
        window.showTextDocument(resource);
    });
    commands.registerCommand(`${AppContext.extName}.upload`, async () => {
        await uploadLocalFile();
        commands.executeCommand('MinIOExplorer.refresh');
    });
    commands.registerCommand(`${AppContext.extName}.download`, (resource: Uri) => {
        console.log('Resource provided:', resource.fsPath);
        if (!resource) {
            window.showErrorMessage('No resource provided for download.');
            return;
        }
        downloadLocalFile(resource);
    });
    commands.registerCommand(`${AppContext.extName}.delete`, async (resource: Uri) => {
        console.log('Resource provided:', resource.fsPath);
        if (!resource) {
            window.showErrorMessage('No resource provided for deletion.');
            return;
        }
        await deleteLocalFile(resource);
        commands.executeCommand('MinIOExplorer.refresh');
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}