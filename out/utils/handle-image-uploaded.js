"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImageUploaded = void 0;
const vscode_1 = require("vscode");
const format_image_link_1 = require("./format-image-link");
const handleImageUploaded = async (imageLink) => {
    const textEditor = vscode_1.window.activeTextEditor;
    if (textEditor && textEditor.document.languageId === 'markdown') {
        textEditor.insertSnippet(new vscode_1.SnippetString((0, format_image_link_1.formatImageLink)(imageLink, 'markdown')));
    }
    else {
        const copyOptions = ['Copy Image Link(Markdown)', 'Copy Image Link(Html)', 'Copy Image Link(Raw)'];
        const selected = await vscode_1.window.showInformationMessage('Bild erfolgreich hochgeladen', {
            modal: true,
            detail: imageLink,
        }, ...copyOptions);
        let textToCopy = '';
        switch (selected) {
            case copyOptions[0]:
                textToCopy = (0, format_image_link_1.formatImageLink)(imageLink, 'markdown');
                break;
            case copyOptions[1]:
                textToCopy = (0, format_image_link_1.formatImageLink)(imageLink, 'html');
                break;
            case copyOptions[2]:
                textToCopy = imageLink;
                break;
        }
        if (textToCopy) {
            await vscode_1.env.clipboard.writeText(textToCopy);
        }
    }
};
exports.handleImageUploaded = handleImageUploaded;
//# sourceMappingURL=handle-image-uploaded.js.map