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

    // MinIO Explorer - initialize without a specific bucket to show all buckets
    const ftpModel = new MinIOModel(serverAddress, accessKey, secretKey, null);
    const ftpTreeDataProvider = new MinIOTreeDataProvider(ftpModel);
    
    // Create TreeView with multi-select enabled
    const treeView = window.createTreeView('MinIOExplorer', {
        treeDataProvider: ftpTreeDataProvider,
        canSelectMany: true
    });
    
    context.subscriptions.push(treeView);
    
    commands.registerCommand('MinIOExplorer.refresh', () => ftpTreeDataProvider.refresh());
    commands.registerCommand('MinIOExplorer.openMinIOResource', resource => {
        window.showTextDocument(resource);
    });
    commands.registerCommand(`${AppContext.extName}.upload`, async (node?: MinIONode) => {
        await uploadLocalFile(node);
        commands.executeCommand('MinIOExplorer.refresh');
    });
    // These commands can be invoked from a tree item context menu. VS Code passes the tree element (MinIONode),
    // not the underlying Uri, so we normalize the argument here.
    const normalizeToUri = (arg: any): Uri | undefined => {
        if (!arg) return undefined;
        if (arg instanceof Uri) return arg;
        if (arg.resource instanceof Uri) return arg.resource as Uri;
        return undefined;
    };

    commands.registerCommand(`${AppContext.extName}.download`, (arg: any, selectedItems?: any[]) => {
        // Handle multi-select: if selectedItems exists and has multiple items, use them
        // Otherwise fall back to single selection
        const resources: Uri[] = [];
        
        if (selectedItems && selectedItems.length > 0) {
            // Multi-select case
            for (const item of selectedItems) {
                const uri = normalizeToUri(item);
                if (uri) resources.push(uri);
            }
        } else {
            // Single select case
            const resource = normalizeToUri(arg);
            if (resource) resources.push(resource);
        }
        
        console.log('Download command resources:', resources.map(r => r.toString()));
        if (resources.length === 0) {
            window.showErrorMessage('No resource provided for download.');
            return;
        }
        
        downloadLocalFile(resources);
    });
    commands.registerCommand(`${AppContext.extName}.copy`, (arg: any, selectedItems?: any[]) => {
        // Handle multi-select: if selectedItems exists and has multiple items, use them
        // Otherwise fall back to single selection
        const resources: Uri[] = [];
        
        if (selectedItems && selectedItems.length > 0) {
            // Multi-select case
            for (const item of selectedItems) {
                const uri = normalizeToUri(item);
                if (uri) resources.push(uri);
            }
        } else {
            // Single select case
            const resource = normalizeToUri(arg);
            if (resource) resources.push(resource);
        }
        
        console.log('Copy command resources:', resources.map(r => r.toString()));
        if (resources.length === 0) {
            window.showErrorMessage('No resource provided for copy link.');
            return;
        }
        
        copyFileURL(resources);
    });
    commands.registerCommand(`${AppContext.extName}.delete`, async (arg: any, selectedItems?: any[]) => {
        // Handle multi-select: if selectedItems exists and has multiple items, use them
        // Otherwise fall back to single selection
        const resources: Uri[] = [];
        
        if (selectedItems && selectedItems.length > 0) {
            // Multi-select case
            for (const item of selectedItems) {
                const uri = normalizeToUri(item);
                if (uri) resources.push(uri);
            }
        } else {
            // Single select case
            const resource = normalizeToUri(arg);
            if (resource) resources.push(resource);
        }
        
        console.log('Delete command resources:', resources.map(r => r.toString()));
        if (resources.length === 0) {
            window.showErrorMessage('No resource provided for deletion.');
            return;
        }
        
        await deleteLocalFile(resources);
        commands.executeCommand('MinIOExplorer.refresh');
    });
}

// This method is called when the extension is deactivated
export function deactivate() {}