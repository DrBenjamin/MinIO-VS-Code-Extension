"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const commands_registration_1 = require("./commands/commands-registration");
const minio_configuration_prodiver_service_1 = require("./services/minio-configuration-prodiver.service");
const app_context_1 = require("./utils/app-context");
const minio_1 = require("./minio");
function activate(context) {
    app_context_1.AppContext.init(context);
    minio_configuration_prodiver_service_1.MinioConfigurationProvider.migrateOld();
    (0, commands_registration_1.registerCommands)();
    // Konfigurationseinstellungen lesen
    const config = vscode.workspace.getConfiguration('minio');
    const serverAddress = config.get('minio.server.address', '127.0.0.1');
    const accessKey = config.get('minio.credential.accessKey', 'user');
    const secretKey = config.get('minio.credential.secretKey', 'password');
    const bucketName = config.get('minio.upload.bucketName', 'bucket');
    // FTP Explorer
    const ftpModel = new minio_1.FtpModel(serverAddress, accessKey, secretKey, bucketName);
    const ftpTreeDataProvider = new minio_1.FtpTreeDataProvider(ftpModel);
    vscode.window.registerTreeDataProvider('ftpExplorer', ftpTreeDataProvider);
    vscode.commands.registerCommand('ftpExplorer.refresh', () => ftpTreeDataProvider.refresh());
    vscode.commands.registerCommand('ftpExplorer.openFtpResource', resource => {
        vscode.window.showTextDocument(resource);
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map