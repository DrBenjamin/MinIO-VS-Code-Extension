import * as vscode from 'vscode';
import * as Minio from 'minio';
import { basename, dirname } from 'path';

interface IEntry {
    name: string;
    type: string;
}

export interface FtpNode {
    resource: vscode.Uri;
    isDirectory: boolean;
}

export class FtpModel {
    private minioClient: Minio.Client;
    constructor(readonly host: string, private user: string, private password: string, private bucket: string = 'bucket') {
        const url = new URL(host);
        const port = url.port ? parseInt(url.port, 10) : 9000;
        this.minioClient = new Minio.Client({
            endPoint: url.hostname,
            port: port,
            useSSL: false,
            accessKey: user,
            secretKey: password,
        });
    }

    public connect(): Thenable<Minio.Client> {
        return new Promise((resolve, reject) => {
            resolve(this.minioClient);
        });
    }

    public get roots(): Thenable<FtpNode[]> {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                const data: FtpNode[] = [];
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

    public getChildren(node: FtpNode): Thenable<FtpNode[]> {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                const data: FtpNode[] = [];
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

    private sort(nodes: FtpNode[]): FtpNode[] {
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

export class FtpTreeDataProvider implements vscode.TreeDataProvider<FtpNode>, vscode.TextDocumentContentProvider {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    constructor(private readonly model: FtpModel) { }

    public refresh(): any {
        this._onDidChangeTreeData.fire(undefined);
    }

    public getTreeItem(element: FtpNode): vscode.TreeItem {
        return {
            resourceUri: element.resource,
            collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
            command: element.isDirectory ? void 0 : {
                command: 'ftpExplorer.openFtpResource',
                arguments: [element.resource],
                title: 'Open FTP Resource'
            }
        };
    }

    public getChildren(element?: FtpNode): FtpNode[] | Thenable<FtpNode[]> {
        return element ? this.model.getChildren(element) : this.model.roots;
    }

    public getParent(element: FtpNode): FtpNode | undefined {
        const parent = element.resource.with({ path: dirname(element.resource.path) });
        return parent.path !== '//' ? { resource: parent, isDirectory: true } : undefined;
    }

    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        return this.model.getContent(uri).then(content => content);
    }
}

export class FtpExplorer {
    private ftpViewer: vscode.TreeView<FtpNode>;
    constructor(context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration('minio');
        const serverAddress = config.get<string>('minio.server.address', '127.0.0.1');
        const accessKey = config.get<string>('minio.credential.accessKey', 'user');
        const secretKey = config.get<string>('minio.credential.secretKey', 'password');
        const bucketName = config.get<string>('minio.upload.bucketName', 'bucket');
        const ftpModel = new FtpModel(serverAddress, accessKey, secretKey, bucketName);
        const treeDataProvider = new FtpTreeDataProvider(ftpModel);
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('minio', treeDataProvider));

        this.ftpViewer = vscode.window.createTreeView('ftpExplorer', { treeDataProvider });

        vscode.commands.registerCommand('ftpExplorer.refresh', () => treeDataProvider.refresh());
        vscode.commands.registerCommand('ftpExplorer.openFtpResource', resource => this.openResource(resource));
        vscode.commands.registerCommand('ftpExplorer.revealResource', () => this.reveal());
    }

    private openResource(resource: vscode.Uri): void {
        vscode.window.showTextDocument(resource);
    }

    private async reveal(): Promise<void> {
        const node = this.getNode();
        if (node) {
            return this.ftpViewer.reveal(node);
        }
    }

    private getNode(): FtpNode | undefined {
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.uri.scheme === 'minio') {
                return { resource: vscode.window.activeTextEditor.document.uri, isDirectory: false };
            }
        }
        return undefined;
    }
}