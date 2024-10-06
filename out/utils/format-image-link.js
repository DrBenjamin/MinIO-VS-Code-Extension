"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatImageLink = void 0;
const formatImageLink = (imageLink, format) => {
    switch (format) {
        case 'html':
            return `<img src="${imageLink}">`;
        case 'markdown':
            return `![image](${imageLink})`;
        default:
            return imageLink;
    }
};
exports.formatImageLink = formatImageLink;
//# sourceMappingURL=format-image-link.js.map