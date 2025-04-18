import * as vscode from 'vscode';
import * as Minio from 'minio';
import { basename, posix } from 'path';

export interface MinIONode {
    resource: vscode.Uri;
    label: string;
    isDirectory: boolean;
}

export class MinIOModel {
    private minioClient: Minio.Client;
    private subDirectory: string;

    /**
     * @param host MinIO server URL
     * @param user Access key
     * @param password Secret key
     * @param bucket Bucket name to browse
     * @param subDirectory Optional subdirectory inside the bucket to start browsing
     */
    constructor(
        readonly host: string,
        private user: string,
        private password: string,
        private bucket: string = 'bucket',
        subDirectory: string = ''
    ) {
        this.subDirectory = subDirectory;
        const url = new URL(host);
        const port = url.port ? parseInt(url.port, 10) : 9000;
        const useSSL = url.protocol === 'https:';
        this.minioClient = new Minio.Client({
            endPoint: url.hostname,
            port: port,
            useSSL: useSSL,
            accessKey: user,
            secretKey: password,
        });
    }

    public connect(): Promise<Minio.Client> {
        return Promise.resolve(this.minioClient);
    }

    public async getChildren(node?: MinIONode): Promise<MinIONode[]> {
        const client = await this.connect();

        // Step 1: Determine and normalize the prefix (start at subDirectory if root)
        let prefix = node ? node.resource.path.substring(1) : this.subDirectory;
        if (prefix && !prefix.endsWith('/')) {
            prefix += '/';
        }

        const recursive = true; // Set to true to retrieve all objects
        const objectsStream = client.listObjectsV2(this.bucket, prefix, recursive);

        return new Promise((resolve, reject) => {
            const foldersMap: Map<string, MinIONode> = new Map();
            const filesMap: Map<string, MinIONode[]> = new Map();

            objectsStream.on('data', (obj) => {
                console.log('Received object:', obj); // Debug log

                if (obj.name) {
                    // This is a file or a folder without a trailing '/'
                    const name = obj.name;

                    // Calculate relative path
                    const relativePath = name.substring(prefix.length);
                    console.log(`Relative Path: ${relativePath}`); // Debug log

                    // Split the relative path into parts
                    const parts = relativePath.split('/').filter(p => p.length > 0);
                    console.log(`Path Parts: ${parts}`); // Debug log

                    if (parts.length === 1) {
                        // This is a file in the current directory
                        const fileName = parts[0];
                        const resourceUri = vscode.Uri.parse(`minio://${this.host}/${name}`);

                        if (!filesMap.has('')) {
                            filesMap.set('', []);
                        }
                        filesMap.get('')?.push({
                            resource: resourceUri,
                            label: fileName,
                            isDirectory: false
                        });
                        console.log(`Added file: ${fileName}`); // Debug log
                    } else if (parts.length > 1) {
                        // This is a directory (immediate subfolder)
                        const folderName = parts[0];
                        if (!foldersMap.has(folderName)) {
                            const folderPath = `${prefix}${folderName}/`;
                            const resourceUri = vscode.Uri.parse(`minio://${this.host}/${folderPath}`);
                            foldersMap.set(folderName, {
                                resource: resourceUri,
                                label: folderName,
                                isDirectory: true,
                            });
                            console.log(`Added folder: ${folderName}`); // Debug log
                        }

                        // Ensure files within this folder are also processed
                        const subfolderPath = `${prefix}${folderName}/`;
                        const subfolderRelativePath = name.substring(subfolderPath.length);
                        const subfolderParts = subfolderRelativePath.split('/').filter(p => p.length > 0);

                        if (subfolderParts.length === 1) {
                            // This is a file within the subfolder
                            const subfileName = subfolderParts[0];
                            //const subfileResourceUri = vscode.Uri.parse(`minio://${this.host}/${name}`);
                            const fullPath = `${folderName}/${subfileName}`;
                            const subfileResourceUri = vscode.Uri.parse(`minio://${this.host}/${fullPath}`);
                            if (!filesMap.has(folderName)) {
                                filesMap.set(folderName, []);
                            }
                            filesMap.get(folderName)?.push({
                                resource: subfileResourceUri,
                                label: subfileName,
                                isDirectory: false
                            });
                            console.log(`Added file in subfolder: ${subfileName}`); // Debug log
                        }
                    }
                }
            });

            objectsStream.on('end', () => {
                // Combine folders and files
                const folders = Array.from(foldersMap.values());
                const files = Array.from(filesMap.values()).flat();
                //resolve([...folders, ...files]);
                resolve([...files]);
            });

            objectsStream.on('error', (err) => {
                console.error('Error listing objects:', err); // Debug log
                vscode.window.showErrorMessage(`Failed to list objects: ${err.message}`);
                reject(err);
            });
        });
    }

    public async getContent(resource: vscode.Uri): Promise<string> {
        const client = await this.connect();
        const objectName = resource.path.substring(1);

        return new Promise((resolve, reject) => {
            client.getObject(this.bucket, objectName, (err, dataStream) => {
                if (err) {
                    return reject(err);
                }

                let content = '';
                dataStream.on('data', (chunk) => {
                    content += chunk.toString();
                });

                dataStream.on('end', () => {
                    resolve(content);
                });

                dataStream.on('error', (err) => {
                    reject(err);
                });
            });
        });
    }
}

export class MinIOTreeDataProvider implements vscode.TreeDataProvider<MinIONode>, vscode.TextDocumentContentProvider {
    private _onDidChangeTreeData: vscode.EventEmitter<MinIONode | undefined | void> = new vscode.EventEmitter<MinIONode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<MinIONode | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private readonly model: MinIOModel) {}

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public getTreeItem(element: MinIONode): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label);
        treeItem.resourceUri = element.resource;
        treeItem.collapsibleState = element.isDirectory
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None;

        if (!element.isDirectory) {
            treeItem.command = {
                command: 'MinIOExplorer.openMinIOResource',
                title: 'Open File',
                arguments: [element.resource],
            };
        }

        return treeItem;
    }

    public getChildren(element?: MinIONode): Thenable<MinIONode[]> {
        return this.model.getChildren(element);
    }

    public getParent(element: MinIONode): MinIONode | undefined {
        const parentPath = posix.dirname(element.resource.path);
        if (parentPath && parentPath !== '/') {
            const parentUri = element.resource.with({ path: parentPath });
            return {
                resource: parentUri,
                label: basename(parentPath),
                isDirectory: true,
            };
        }
        return undefined;
    }

    public provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
        return this.model.getContent(uri);
    }
}

export class MinIOExplorer {
    private minioViewer: vscode.TreeView<MinIONode>;

    constructor(context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration('minio');
        const serverAddress = config.get<string>('minio.server.address', 'http://127.0.0.1:9000');
        const accessKey = config.get<string>('minio.credential.accessKey', 'user');
        const secretKey = config.get<string>('minio.credential.secretKey', 'password');
        const bucketName = config.get<string>('minio.upload.bucketName', 'bucket');

        const minioModel = new MinIOModel(serverAddress, accessKey, secretKey, bucketName);
        const treeDataProvider = new MinIOTreeDataProvider(minioModel);

        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('minio', treeDataProvider));

        this.minioViewer = vscode.window.createTreeView('MinExplorer', { treeDataProvider });

        vscode.commands.registerCommand('MinIOExplorer.refresh', () => treeDataProvider.refresh());
        vscode.commands.registerCommand('MinIOExplorer.openMinIOResource', (resource) => this.openResource(resource));
        vscode.commands.registerCommand('MinExplorer.revealResource', () => this.reveal());
    }

    private openResource(resource: vscode.Uri): void {
        vscode.window.showTextDocument(resource);
    }

    private async reveal(): Promise<void> {
        const node = this.getNode();
        if (node) {
            await this.minioViewer.reveal(node);
        }
    }

    private getNode(): MinIONode | undefined {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.uri.scheme === 'minio') {
            return {
                resource: editor.document.uri,
                label: basename(editor.document.uri.path),
                isDirectory: false,
            };
        }
        return undefined;
    }
}