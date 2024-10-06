import * as vscode from 'vscode';
import { registerCommands } from './commands/commands-registration';
import { MinioConfigurationProvider } from './services/minio-configuration-prodiver.service';
import { AppContext } from './utils/app-context';
import { FtpModel, FtpTreeDataProvider } from './minio';

export function activate(context: vscode.ExtensionContext) {
    AppContext.init(context);
    MinioConfigurationProvider.migrateOld();
    registerCommands();

    // Konfigurationseinstellungen lesen
    const config = vscode.workspace.getConfiguration('minio');
    const serverAddress = config.get<string>('minio.server.address', '127.0.0.1');
    const accessKey = config.get<string>('minio.credential.accessKey', 'user');
    const secretKey = config.get<string>('minio.credential.secretKey', 'password');
    const bucketName = config.get<string>('minio.upload.bucketName', 'bucket');

    // FTP Explorer
    const ftpModel = new FtpModel(serverAddress, accessKey, secretKey, bucketName);
    const ftpTreeDataProvider = new FtpTreeDataProvider(ftpModel);
    vscode.window.registerTreeDataProvider('ftpExplorer', ftpTreeDataProvider);
    vscode.commands.registerCommand('ftpExplorer.refresh', () => ftpTreeDataProvider.refresh());
    vscode.commands.registerCommand('ftpExplorer.openFtpResource', resource => {
        vscode.window.showTextDocument(resource);
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}