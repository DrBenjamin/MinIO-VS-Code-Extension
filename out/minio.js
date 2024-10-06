"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FtpExplorer = exports.FtpTreeDataProvider = exports.FtpModel = void 0;
const vscode = require("vscode");
const Minio = require("minio");
const path_1 = require("path");
class FtpModel {
    constructor(host, user, password, bucket = 'bucket') {
        this.host = host;
        this.user = user;
        this.password = password;
        this.bucket = bucket;
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
    connect() {
        return new Promise((resolve, reject) => {
            resolve(this.minioClient);
        });
    }
    get roots() {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                const data = [];
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
    getChildren(node) {
        return this.connect().then(client => {
            return new Promise((resolve, reject) => {
                const data = [];
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
    sort(nodes) {
        return nodes.sort((n1, n2) => {
            if (n1.isDirectory && !n2.isDirectory) {
                return -1;
            }
            if (!n1.isDirectory && n2.isDirectory) {
                return 1;
            }
            return (0, path_1.basename)(n1.resource.fsPath).localeCompare((0, path_1.basename)(n2.resource.fsPath));
        });
    }
    getContent(resource) {
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
exports.FtpModel = FtpModel;
class FtpTreeDataProvider {
    constructor(model) {
        this.model = model;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
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
    getChildren(element) {
        return element ? this.model.getChildren(element) : this.model.roots;
    }
    getParent(element) {
        const parent = element.resource.with({ path: (0, path_1.dirname)(element.resource.path) });
        return parent.path !== '//' ? { resource: parent, isDirectory: true } : undefined;
    }
    provideTextDocumentContent(uri, token) {
        return this.model.getContent(uri).then(content => content);
    }
}
exports.FtpTreeDataProvider = FtpTreeDataProvider;
class FtpExplorer {
    constructor(context) {
        const config = vscode.workspace.getConfiguration('minio');
        const serverAddress = config.get('minio.server.address', '127.0.0.1');
        const accessKey = config.get('minio.credential.accessKey', 'user');
        const secretKey = config.get('minio.credential.secretKey', 'password');
        const bucketName = config.get('minio.upload.bucketName', 'bucket');
        const ftpModel = new FtpModel(serverAddress, accessKey, secretKey, bucketName);
        const treeDataProvider = new FtpTreeDataProvider(ftpModel);
        context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('minio', treeDataProvider));
        this.ftpViewer = vscode.window.createTreeView('ftpExplorer', { treeDataProvider });
        vscode.commands.registerCommand('ftpExplorer.refresh', () => treeDataProvider.refresh());
        vscode.commands.registerCommand('ftpExplorer.openFtpResource', resource => this.openResource(resource));
        vscode.commands.registerCommand('ftpExplorer.revealResource', () => this.reveal());
    }
    openResource(resource) {
        vscode.window.showTextDocument(resource);
    }
    async reveal() {
        const node = this.getNode();
        if (node) {
            return this.ftpViewer.reveal(node);
        }
    }
    getNode() {
        if (vscode.window.activeTextEditor) {
            if (vscode.window.activeTextEditor.document.uri.scheme === 'minio') {
                return { resource: vscode.window.activeTextEditor.document.uri, isDirectory: false };
            }
        }
        return undefined;
    }
}
exports.FtpExplorer = FtpExplorer;
//# sourceMappingURL=minio.js.map