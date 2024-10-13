import { ConfigurationTarget, workspace } from 'vscode';
import { MinioConfiguration } from '../models/minio-configuration';
import { AppContext } from '../utils/app-context';

export class MinioConfigurationProvider {
    static get minioConfiguration(): MinioConfiguration {
        const configuration = workspace.getConfiguration(AppContext.extName);
        const serverAddress = configuration.get<string>('minio.server.address') ?? '';
        const accessKey = configuration.get<string>('minio.credential.accessKey') ?? '';
        const secretKey = configuration.get<string>('minio.credential.secretKey') ?? '';
        const bucketName = configuration.get<string>('minio.upload.bucketName') ?? '';
        const subdirectory = configuration.get<string>('minio.upload.directory') ?? '';
        let [scheme, host] = serverAddress.split(/:?\/\//);
        let port: number = 0;
        host = host.replace(/:(\d{2,})/, (_, sub1) => {
            port = parseInt(sub1, 10);
            return '';
        });

        return new MinioConfiguration(
            {
                accessKey,
                secretKey,
                endPoint: host,
                useSSL: scheme === 'https',
                port: port > 0 ? port : undefined,
            },
            bucketName,
            subdirectory,
        );
    }

    private static get configuration() {
        return workspace.getConfiguration(AppContext.extName);
    }

    static migrateOld() {
        for (const [newKey, oldKey] of [
            ['minio.server.address', 'minioServerAddress'],
            ['minio.credential.accessKey', 'minioAccessKey'],
            ['minio.credential.secretKey', 'minioSecretKey'],
            ['minio.upload.bucketName', 'minioBucketName'],
            ['minio.upload.directory', 'subdirectoryInMinioBucket'],
        ] as const) {
            const oldValueSpec = this.configuration.inspect(oldKey);
            if (oldValueSpec == null) {
                continue;
            }
            const { workspaceValue, globalValue, defaultValue, workspaceFolderValue } = oldValueSpec;
            const newValueSpec = this.configuration.inspect(newKey);

            const deleteOld = (target: ConfigurationTarget) => this.configuration.update(oldKey, undefined, target);
            const update = (value: any, target: ConfigurationTarget) => {
                this.configuration.update(newKey, value, target);
                deleteOld(target);
            };
            const check = (oldValue: any, newValue: any, target: ConfigurationTarget) =>
                oldValue != null && oldValue !== defaultValue && !newValue
                    ? () => update(oldValue, target)
                    : () => deleteOld(target);

            check(globalValue, newValueSpec?.globalValue, ConfigurationTarget.Global)?.call(null);
            check(workspaceValue, newValueSpec?.workspaceValue, ConfigurationTarget.Workspace)?.call(null);
            check(workspaceFolderValue, newValueSpec?.workspaceFolderValue, ConfigurationTarget.WorkspaceFolder);
        }
    }
}
