"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioConfigurationProvider = void 0;
const vscode_1 = require("vscode");
const minio_configuration_1 = require("../models/minio-configuration");
const app_context_1 = require("../utils/app-context");
class MinioConfigurationProvider {
    static get minioConfiguration() {
        const configuration = vscode_1.workspace.getConfiguration(app_context_1.AppContext.extName);
        const serverAddress = configuration.get('minio.server.address') ?? '';
        const accessKey = configuration.get('minio.credential.accessKey') ?? '';
        const secretKey = configuration.get('minio.credential.secretKey') ?? '';
        const bucketName = configuration.get('minio.upload.bucketName') ?? '';
        const subdirectory = configuration.get('minio.upload.directory') ?? '';
        let [scheme, host] = serverAddress.split(/:?\/\//);
        let port = 0;
        host = host.replace(/:(\d{2,})/, (_, sub1) => {
            port = parseInt(sub1, 10);
            return '';
        });
        return new minio_configuration_1.MinioConfiguration({
            accessKey,
            secretKey,
            endPoint: host,
            useSSL: scheme === 'https',
            port: port > 0 ? port : undefined,
        }, bucketName, subdirectory);
    }
    static get configuration() {
        return vscode_1.workspace.getConfiguration(app_context_1.AppContext.extName);
    }
    static migrateOld() {
        for (const [newKey, oldKey] of [
            ['minio.server.address', 'minioServerAddress'],
            ['minio.credential.accessKey', 'minioAccessKey'],
            ['minio.credential.secretKey', 'minioSecretKey'],
            ['minio.upload.bucketName', 'minioBucketName'],
            ['minio.upload.directory', 'subdirectoryInMinioBucket'],
        ]) {
            const oldValueSpec = this.configuration.inspect(oldKey);
            if (oldValueSpec == null) {
                continue;
            }
            const { workspaceValue, globalValue, defaultValue, workspaceFolderValue } = oldValueSpec;
            const newValueSpec = this.configuration.inspect(newKey);
            const deleteOld = (target) => this.configuration.update(oldKey, undefined, target);
            const update = (value, target) => {
                this.configuration.update(newKey, value, target);
                deleteOld(target);
            };
            const check = (oldValue, newValue, target) => oldValue != null && oldValue !== defaultValue && !newValue
                ? () => update(oldValue, target)
                : () => deleteOld(target);
            check(globalValue, newValueSpec?.globalValue, vscode_1.ConfigurationTarget.Global)?.call(null);
            check(workspaceValue, newValueSpec?.workspaceValue, vscode_1.ConfigurationTarget.Workspace)?.call(null);
            check(workspaceFolderValue, newValueSpec?.workspaceFolderValue, vscode_1.ConfigurationTarget.WorkspaceFolder);
        }
    }
}
exports.MinioConfigurationProvider = MinioConfigurationProvider;
//# sourceMappingURL=minio-configuration-prodiver.service.js.map