import { ExtensionContext, workspace, commands, window, Uri } from 'vscode';
import { MinioConfigurationProvider } from './services/minio-configuration-prodiver.service';
import { AppContext } from './utils/app-context';
import { MinIOModel, MinIOTreeDataProvider, MinIONode } from './minio';
import { uploadLocalFile } from './commands/upload';
import { downloadLocalFile } from './commands/download';
import { copyFileURL } from './commands/copy';
import { deleteLocalFile } from './commands/delete';

export function activate(context: ExtensionContext) {
    AppContext.init(context);
    MinioConfigurationProvider.migrateOld();

    // Read configuration
    const config = workspace.getConfiguration('minio');
    const serverAddress = config.get<string>('minio.server.address', '127.0.0.1');
    const accessKey = config.get<string>('minio.credential.accessKey', 'user');
    const secretKey = config.get<string>('minio.credential.secretKey', 'password');
    /** Optional subdirectory inside buckets to start browsing */
    const subDirectory = config.get<string>('minio.upload.directory', '');

    // MinIO Explorer - initialize without a specific bucket to show all buckets
    const ftpModel = new MinIOModel(serverAddress, accessKey, secretKey, null, subDirectory);
    const ftpTreeDataProvider = new MinIOTreeDataProvider(ftpModel);
    window.registerTreeDataProvider('MinIOExplorer', ftpTreeDataProvider);
    commands.registerCommand('MinIOExplorer.refresh', () => ftpTreeDataProvider.refresh());
    commands.registerCommand('MinIOExplorer.openMinIOResource', resource => {
        window.showTextDocument(resource);
    });
    commands.registerCommand(`${AppContext.extName}.upload`, async (node?: MinIONode) => {
        await uploadLocalFile(node);
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
    commands.registerCommand(`${AppContext.extName}.copy`, (resource: Uri) => {
        console.log('Resource provided:', resource.fsPath);
        if (!resource) {
            window.showErrorMessage('No resource provided for copy link.');
            return;
        }
        copyFileURL(resource);
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

// This method is called when the extension is deactivated
export function deactivate() {}