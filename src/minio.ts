import * as vscode from 'vscode';
import * as Minio from 'minio';
import { basename, dirname } from 'path';

interface IEntry {
    name: string;
    type: string;
}

export interface MinIONode {
    resource: vscode.Uri;
    isDirectory: boolean;
}

export class MinIOModel {
    private minioClient: Minio.Client;
    constructor(readonly host: string, private user: string, private password: string, private bucket: string = 'bucket') {
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

    public connect(): Thenable<Minio.Client> {
        return new Promise((resolve, reject) => {
            resolve(this.minioClient);
        });
    }

    public get roots(): Thenable<MinIONode[]> {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                const data: MinIONode[] = [];
                const stream = client.listObjects(this.bucket, '', true);
                stream.on('data', (obj) => {
                    data.push({ resource: vscode.Uri.parse(`minio://${this.host}/${obj.name}`), isDirectory: false });
                });
                stream.on('end', () => {
                    resolve(data);
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            });
        });
    }

    public getChildren(node: MinIONode): Thenable<MinIONode[]> {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                const data: MinIONode[] = [];
                const stream = client.listObjects(this.bucket, node.resource.path.substr(1), true);
                stream.on('data', (obj) => {
                    data.push({ resource: vscode.Uri.parse(`${node.resource.path}/${obj.name}`), isDirectory: false });
                });
                stream.on('end', () => {
                    resolve(data);
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            });
        });
    }

    private sort(nodes: MinIONode[]): MinIONode[] {
        return nodes.sort((n1, n2) => {
            if (n1.isDirectory && !n2.isDirectory) {
                return -1;
            }

            if (!n1.isDirectory && n2.isDirectory) {
                return 1;
            }

            return basename(n1.resource.fsPath).localeCompare(basename(n2.resource.fsPath));
        });
    }

    public getContent(resource: vscode.Uri): Thenable<string> {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                client.getObject(this.bucket, resource.path.substr(1), (err, stream) => {
                    if (err) {
                        return reject(err);
                    }

                    let string = '';
                    stream.on('data', (buffer) => {
                        if (buffer) {
                            const part = buffer.toString();
                            string += part;
                        }
                    });

                    stream.on('end', () => {
                        resolve(string);
                    });

                    stream.on('error', (err) => {
                        reject(err);
                    });
                });
            });
        });
    }
}

export class MinIOTreeDataProvider implements vscode.TreeDataProvider<MinIONode>, vscode.TextDocumentContentProvider {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    constructor(private readonly model: MinIOModel) { }

    public refresh(): any {
        this._onDidChangeTreeData.fire(undefined);
    }

    public getTreeItem(element: MinIONode): vscode.TreeItem {
        return {
            resourceUri: element.resource,
            collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
            command: element.isDirectory ? void 0 : {
                command: 'MinIOExplorer.openMinIOResource',
                arguments: [element.resource],
                title: 'Open MinIO Resource'
            }
        };
    }

    public getChildren(element?: MinIONode): MinIONode[] | Thenable<MinIONode[]> {
        return element ? this.model.getChildren(element) : this.model.roots;
    }

    public getParent(element: MinIONode): MinIONode | undefined {
        const parent = element.resource.with({ path: dirname(element.resource.path) });
        return parent.path !== '//' ? { resource: parent, isDirectory: true } : undefined;
    }

    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        return this.model.getContent(uri).then(content => content);
    }
}

export class MinIOExplorer {
    private MinIOViewer: vscode.TreeView<MinIONode>;
    constructor(context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration('minio');
        const serverAddress = config.get<string>('minio.server.address', '127.0.0.1');
        const accessKey = config.get<string>('minio.credential.accessKey', 'user');
        const secretKey = config.get<string>('minio.credential.secretKey', 'password');
        const bucketName = config.get<string>('minio.upload.bucketName', 'bucket');
        const minioModel = new MinIOModel(serverAddress, accessKey, secretKey, bucketName);
        const treeDataProvider = new MinIOTreeDataProvider(minioModel);
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('minio', treeDataProvider));

        this.MinIOViewer = vscode.window.createTreeView('MinExplorer', { treeDataProvider });

        vscode.commands.registerCommand('MinIOExplorer.refresh', () => treeDataProvider.refresh());
        vscode.commands.registerCommand('MinIOExplorer.openMinIOResource', resource => this.openResource(resource));
        vscode.commands.registerCommand('MinExplorer.revealResource', () => this.reveal());
    }

    private openResource(resource: vscode.Uri): void {
        vscode.window.showTextDocument(resource);
    }

    private async reveal(): Promise<void> {
        const node = this.getNode();
        if (node) {
            return this.MinIOViewer.reveal(node);
        }
    }

    private getNode(): MinIONode | undefined {
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.uri.scheme === 'minio') {
                return { resource: vscode.window.activeTextEditor.document.uri, isDirectory: false };
            }
        }
        return undefined;
    }
}