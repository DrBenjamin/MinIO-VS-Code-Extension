"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocalFile = void 0;
const vscode = require("vscode");
const delete_service_1 = require("../services/delete.service");
const path = require("path");
const deleteLocalFile = async (resource) => {
    const resourcePath = JSON.parse(JSON.stringify(resource)).resource.path;
    const fileName = path.basename(resourcePath);
    const imageLink = await vscode.window.withProgress({ title: 'Deleting file', location: vscode.ProgressLocation.Notification }, async (p) => {
        p.report({ increment: 10 });
        let imageLink = '';
        try {
            const imageDeleteService = delete_service_1.ImageDeleteService.instance;
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
exports.deleteLocalFile = deleteLocalFile;
//# sourceMappingURL=delete.js.map