"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = void 0;
const vscode_1 = require("vscode");
const app_context_1 = require("../utils/app-context");
const upload_clipboard_image_1 = require("./upload-clipboard-image");
const upload_local_disk_image_1 = require("./upload-local-disk-image");
const download_local_disk_image_1 = require("./download-local-disk-image");
const registerCommands = () => {
    app_context_1.AppContext.extContext.subscriptions.push(vscode_1.commands.registerCommand(`${app_context_1.AppContext.extName}.upload-local-disk-image`, upload_local_disk_image_1.uploadLocalDiskImage), vscode_1.commands.registerCommand(`${app_context_1.AppContext.extName}.upload-clipboard-image`, upload_clipboard_image_1.uploadClipboardImage), vscode_1.commands.registerCommand(`${app_context_1.AppContext.extName}.download-local-disk-image`, (resource) => {
        console.log('Resource provided:', resource.fsPath);
        if (!resource) {
            vscode_1.window.showErrorMessage('No resource provided for download.');
            return;
        }
        (0, download_local_disk_image_1.downloadLocalDiskImage)(resource);
    }));
};
exports.registerCommands = registerCommands;
//# sourceMappingURL=commands-registration.js.map