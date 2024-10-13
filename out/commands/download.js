"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadLocalFile = void 0;
const vscode = require("vscode");
const download_service_1 = require("../services/download.service");
const path = require("path");
const handle_file_downloaded_1 = require("../utils/handle-file-downloaded");
const downloadLocalFile = async (resource) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path;
    const fileName = path.basename(resourcePath);
    const imageLink = await vscode.window.withProgress({ title: 'Downloading file', location: vscode.ProgressLocation.Notification }, async (p) => {
        p.report({ increment: 10 });
        let imageLink = '';
        try {
            const imageDownloadService = download_service_1.FileDownloadService.instance;
            await imageDownloadService.download(fileName);
            const config = vscode.workspace.getConfiguration('minio');
            const filePath = config.get('minio.download.directory', '/Users/username/Downloads');
            imageLink = `${filePath}/${fileName}`;
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to download file', {
                detail: err instanceof Error ? err.message : JSON.stringify(err),
                modal: true,
            });
        }
        p.report({ increment: 100 });
        return imageLink;
    });
    (0, handle_file_downloaded_1.handleFileDownloaded)(imageLink);
};
exports.downloadLocalFile = downloadLocalFile;
//# sourceMappingURL=download.js.map