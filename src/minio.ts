import * as vscode from 'vscode';
import * as Minio from 'minio';
import { basename, posix } from 'path';

export interface MinIONode {
    resource: vscode.Uri;
    label: string;
    isDirectory: boolean;
    isBucket?: boolean;
}

export class MinIOModel {
    private minioClient: Minio.Client;
    private currentBucket: string | null = null;
    private uriAuthority: string; // sanitized host authority used in minio:// URIs

    /**
     * @param host MinIO server URL
     * @param user Access key
     * @param password Secret key
     * @param bucket Bucket name to browse (optional - if null, shows all buckets)
     */
    constructor(
        readonly host: string,
        private user: string,
        private password: string,
        private bucket: string | null = null
    ) {
        this.currentBucket = bucket;
        let endPoint = host;
        let port = 9000;
        let useSSL = false;
        try {
            const normalized = /^(https?:\/\/)/.test(host) ? host : `http://${host}`;
            const url = new URL(normalized);
            endPoint = url.hostname;
            port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);
            useSSL = url.protocol === 'https:';
        } catch {
            // treat host as raw endpoint (host[:port]) maybe
            const hostParts = host.split(':');
            if (hostParts.length === 2 && !isNaN(Number(hostParts[1]))) {
                endPoint = hostParts[0];
                port = Number(hostParts[1]);
            }
        }
        this.uriAuthority = endPoint + (port && port !== 80 && port !== 443 ? `:${port}` : '');
        this.minioClient = new Minio.Client({
            endPoint,
            port,
            useSSL,
            accessKey: user,
            secretKey: password,
        });
    }

    public connect(): Promise<Minio.Client> {
        return Promise.resolve(this.minioClient);
    }

    public async getBuckets(): Promise<MinIONode[]> {
        const client = await this.connect();
        try {
            const buckets = await client.listBuckets();
            return buckets.map(bucket => ({
                resource: vscode.Uri.parse(`minio://${this.uriAuthority}/${bucket.name}/`),
                label: bucket.name,
                isDirectory: true,
                isBucket: true
            }));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to list buckets: ${error}`);
            return [];
        }
    }

    public setCurrentBucket(bucketName: string) {
        this.currentBucket = bucketName;
    }

    public getCurrentBucket(): string | null {
        return this.currentBucket;
    }

    public async getChildren(node?: MinIONode): Promise<MinIONode[]> {
        // If no specific bucket is set and no node is provided, show all buckets
        if (!node && !this.currentBucket) {
            return this.getBuckets();
        }

        const client = await this.connect();
        
        // Determine which bucket we're working with
        let bucketName: string;
        let prefix = '';

        if (!node) {
            // Root of a specific bucket
            if (!this.currentBucket) {
                return this.getBuckets();
            }
            bucketName = this.currentBucket;
            prefix = '';
        } else if (node.isBucket) {
            // Expanding a bucket - show its root contents
            bucketName = node.label;
            prefix = '';
        } else {
            // Expanding a folder within a bucket
            const pathParts = node.resource.path.substring(1).split('/');
            bucketName = pathParts[0];
            prefix = pathParts.slice(1).join('/');
            if (prefix && !prefix.endsWith('/')) {
                prefix += '/';
            }
        }

        const recursive = false; // Only get immediate children
        const objectsStream = client.listObjectsV2(bucketName, prefix, recursive);

        return new Promise((resolve, reject) => {
            const children: MinIONode[] = [];
            const seenFolders = new Set<string>();

            objectsStream.on('data', (obj: any) => {
                // Folders (common prefixes) are returned with a 'prefix' property when recursive=false
                if (obj.prefix) {
                    const folderFullPath: string = obj.prefix; // e.g. 'folder1/' or 'folder1/sub2/'
                    // Derive folder name relative to current prefix
                    const withoutCurrentPrefix = folderFullPath.substring(prefix.length);
                    const folderName = withoutCurrentPrefix.split('/').filter(Boolean)[0];
                    if (folderName && !seenFolders.has(folderName)) {
                        seenFolders.add(folderName);
                        const folderPath = `${bucketName}/${prefix}${folderName}/`;
                        const resourceUri = vscode.Uri.parse(`minio://${this.uriAuthority}/${folderPath}`);
                        children.push({
                            resource: resourceUri,
                            label: folderName,
                            isDirectory: true,
                            isBucket: false
                        });
                    }
                    return; // handled
                }

                if (obj.name) {
                    const objectName: string = obj.name;
                    // Relative path from current prefix
                    const relativePath = objectName.substring(prefix.length);
                    if (!relativePath) return;
                    const parts = relativePath.split('/');
                    if (parts.length === 1 && parts[0]) {
                        // File
                        const fileName = parts[0];
                        const resourceUri = vscode.Uri.parse(`minio://${this.uriAuthority}/${bucketName}/${objectName}`);
                        children.push({
                            resource: resourceUri,
                            label: fileName,
                            isDirectory: false,
                            isBucket: false
                        });
                    } else if (parts.length > 1 && parts[0]) {
                        // Fallback: infer folder from deeper object name (useful if recursive=true in future)
                        const folderName = parts[0];
                        if (!seenFolders.has(folderName)) {
                            seenFolders.add(folderName);
                            const folderPath = `${bucketName}/${prefix}${folderName}/`;
                            const resourceUri = vscode.Uri.parse(`minio://${this.uriAuthority}/${folderPath}`);
                            children.push({
                                resource: resourceUri,
                                label: folderName,
                                isDirectory: true,
                                isBucket: false
                            });
                        }
                    }
                }
            });

            objectsStream.on('end', () => {
                // Sort: folders first, then files
                children.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.label.localeCompare(b.label);
                });
                
                resolve(children);
            });

            objectsStream.on('error', (err) => {
                console.error('Error listing objects:', err);
                vscode.window.showErrorMessage(`Failed to list objects: ${err.message}`);
                reject(err);
            });
        });
    }

    public async getContent(resource: vscode.Uri): Promise<string> {
        const client = await this.connect();
        const pathParts = resource.path.substring(1).split('/');
        const bucketName = pathParts[0];
        const objectName = pathParts.slice(1).join('/');

        return new Promise((resolve, reject) => {
            client.getObject(bucketName, objectName, (err, dataStream) => {
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
        
        if (element.isBucket) {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.iconPath = new vscode.ThemeIcon('database');
            treeItem.contextValue = 'bucket';
        } else if (element.isDirectory) {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.iconPath = vscode.ThemeIcon.Folder;
            treeItem.contextValue = 'folder';
        } else {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
            treeItem.iconPath = vscode.ThemeIcon.File;
            treeItem.contextValue = 'file';
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

        const minioModel = new MinIOModel(serverAddress, accessKey, secretKey, null);
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