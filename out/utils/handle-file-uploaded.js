"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImageUploaded = void 0;
const vscode_1 = require("vscode");
const handleImageUploaded = async (imageLink) => {
    const copyOptions = ['Copy File Link'];
    const selected = await vscode_1.window.showInformationMessage('File uploaded successfully', {
        modal: true,
        detail: imageLink,
    }, ...copyOptions);
    let textToCopy = '';
    switch (selected) {
        case copyOptions[0]:
            textToCopy = imageLink;
            break;
    }
    if (textToCopy) {
        await vscode_1.env.clipboard.writeText(textToCopy);
    }
};
exports.handleImageUploaded = handleImageUploaded;
//# sourceMappingURL=handle-file-uploaded.js.map