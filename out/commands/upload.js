"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLocalFile = void 0;
const vscode_1 = require("vscode");
const fs = require("fs");
const upload_service_1 = require("../services/upload.service");
const path = require("path");
const handle_file_uploaded_1 = require("../utils/handle-file-uploaded");
const uploadLocalFile = async () => {
    const fileUri = ((await vscode_1.window.showOpenDialog({
        title: 'Select file',
        canSelectMany: false,
    })) ?? [])[0];
    if (!fileUri) {
        return;
    }
    const { fsPath: filePath } = fileUri;
    const fileName = path.basename(filePath);
    const imageLink = await vscode_1.window.withProgress({ title: 'Uploading file', location: vscode_1.ProgressLocation.Notification }, async (p) => {
        p.report({ increment: 10 });
        let imageLink = '';
        try {
            imageLink = await upload_service_1.fileUploadService.upload(fs.createReadStream(filePath), fileName);
        }
        catch (err) {
            vscode_1.window.showErrorMessage('Failed to upload file', {
                detail: err instanceof Error ? err.message : JSON.stringify(err),
                modal: true,
            });
        }
        p.report({ increment: 100 });
        return imageLink;
    });
    (0, handle_file_uploaded_1.handleImageUploaded)(imageLink);
};
exports.uploadLocalFile = uploadLocalFile;
//# sourceMappingURL=upload.js.map