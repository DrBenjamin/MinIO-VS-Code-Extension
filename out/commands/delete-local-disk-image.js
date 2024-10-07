"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocalDiskImage = void 0;
const vscode = require("vscode");
const image_delete_service_1 = require("../services/image-delete.service");
const path = require("path");
const deleteLocalDiskImage = async (resource) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path;
    const fileName = path.basename(resourcePath);
    const imageLink = await vscode.window.withProgress({ title: 'Deleting file', location: vscode.ProgressLocation.Notification }, async (p) => {
        p.report({ increment: 10 });
        let imageLink = '';
        try {
            const imageDeleteService = image_delete_service_1.ImageDeleteService.instance;
            await imageDeleteService.delete(fileName);
            imageLink = `${fileName} successfully deleted.`;
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to delete file', {
                detail: err instanceof Error ? err.message : JSON.stringify(err),
                modal: true,
            });
        }
        p.report({ increment: 100 });
        return imageLink;
    });
    vscode.window.showInformationMessage(imageLink);
};
exports.deleteLocalDiskImage = deleteLocalDiskImage;
//# sourceMappingURL=delete-local-disk-image.js.map