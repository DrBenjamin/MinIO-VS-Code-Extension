"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadLocalDiskImage = void 0;
const vscode = require("vscode");
const image_download_service_1 = require("../services/image-download.service");
const path = require("path");
const downloadLocalDiskImage = async (resource) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path;
    const fileName = path.basename(resourcePath);
    const imageLink = await vscode.window.withProgress({ title: 'Downloading file', location: vscode.ProgressLocation.Notification }, async (p) => {
        p.report({ increment: 10 });
        let imageLink = '';
        try {
            const imageDownloadService = image_download_service_1.ImageDownloadService.instance;
            await imageDownloadService.download(fileName);
            imageLink = `Downloaded ${fileName} successfully.`;
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
    vscode.window.showInformationMessage(imageLink);
};
exports.downloadLocalDiskImage = downloadLocalDiskImage;
//# sourceMappingURL=download-local-disk-image.js.map