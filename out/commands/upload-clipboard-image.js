"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadClipboardImage = void 0;
const vscode_1 = require("vscode");
const image_upload_service_1 = require("../services/image-upload.service");
const get_clipboard_image_1 = require("../utils/get-clipboard-image");
const fs = require("fs");
const handle_image_uploaded_1 = require("../utils/handle-image-uploaded");
const path = require("path");
const noImagePath = 'no image';
const uploadClipboardImage = async () => {
    const clipboardImage = await (0, get_clipboard_image_1.default)();
    if (clipboardImage.imgPath === noImagePath) {
        vscode_1.window.showWarningMessage('No image found in clipboard');
        return;
    }
    try {
        const imageLink = await vscode_1.window.withProgress({ title: 'Uploading image', location: vscode_1.ProgressLocation.Notification }, async (p) => {
            p.report({ increment: 10 });
            return await image_upload_service_1.imageUploadService.upload(fs.createReadStream(clipboardImage.imgPath), path.basename(clipboardImage.imgPath));
        });
        (0, handle_image_uploaded_1.handleImageUploaded)(imageLink);
    }
    finally {
        if (!clipboardImage.shouldKeepAfterUploading) {
            vscode_1.workspace.fs.delete(vscode_1.Uri.file(clipboardImage.imgPath));
        }
    }
};
exports.uploadClipboardImage = uploadClipboardImage;
//# sourceMappingURL=upload-clipboard-image.js.map