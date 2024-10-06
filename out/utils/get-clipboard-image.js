"use strict";
// reference: https://github.com/PicGo/PicGo-Core/blob/dev/src/utils/getClipboardImage.ts
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const isWsl = require("is-wsl");
const date_fns_1 = require("date-fns");
const app_context_1 = require("./app-context");
const util_1 = require("util");
const vscode_1 = require("vscode");
const getCurrentPlatform = () => {
    const platform = process.platform;
    if (isWsl) {
        return 'wsl';
    }
    if (platform === 'win32') {
        const currentOS = os.release().split('.')[0];
        if (currentOS === '10') {
            return 'win10';
        }
        else {
            return 'win32';
        }
    }
    else if (platform === 'darwin') {
        return 'darwin';
    }
    else {
        return 'linux';
    }
};
const readClipboardScript = (scriptName) => {
    const buffer = fs.readFileSync(app_context_1.AppContext.extContext.asAbsolutePath(`dist/assets/scripts/clipboard/${scriptName}`));
    return new util_1.TextDecoder().decode(buffer);
};
const platform2ScriptContent = () => ({
    darwin: readClipboardScript('mac.applescript'),
    win32: readClipboardScript('windows.ps1'),
    win10: readClipboardScript('windows10.ps1'),
    linux: readClipboardScript('linux.sh'),
    wsl: readClipboardScript('wsl.sh'),
});
/**
 * powershell will report error if file does not have a '.ps1' extension,
 * so we should keep the extension name consistent with corresponding shell
 */
const platform2ScriptFilename = {
    darwin: 'mac.applescript',
    win32: 'windows.ps1',
    win10: 'windows10.ps1',
    linux: 'linux.sh',
    wsl: 'wsl.sh',
};
const getClipboardImage = async () => {
    const imagePath = path.join(app_context_1.AppContext.extContext.asAbsolutePath('./'), `${(0, date_fns_1.format)(new Date(), 'yyyyMMddHHmmss')}.png`);
    return await new Promise((resolve, reject) => {
        const platform = getCurrentPlatform();
        const scriptPath = path.join(__dirname, platform2ScriptFilename[platform]);
        // If the script does not exist yet, we need to write the content to the script file
        if (!fs.existsSync(scriptPath)) {
            fs.writeFileSync(scriptPath, platform2ScriptContent()[platform], 'utf8');
        }
        let execution;
        if (platform === 'darwin') {
            execution = (0, child_process_1.spawn)('osascript', [scriptPath, imagePath]);
        }
        else if (platform === 'win32' || platform === 'win10') {
            execution = (0, child_process_1.spawn)('powershell', [
                '-noprofile',
                '-noninteractive',
                '-nologo',
                '-sta',
                '-executionpolicy',
                'unrestricted',
                // fix windows 10 native cmd crash bug when "picgo upload"
                // https://github.com/PicGo/PicGo-Core/issues/32
                // '-windowstyle','hidden',
                // '-noexit',
                '-file',
                scriptPath,
                imagePath,
            ]);
        }
        else {
            execution = (0, child_process_1.spawn)('sh', [scriptPath, imagePath]);
        }
        execution.stdout.on('data', (data) => {
            if (platform === 'linux') {
                if (data.toString().trim() === 'no xclip') {
                    vscode_1.window.showWarningMessage('xclip not found, Please install xclip first');
                    return reject(new Error('Please install xclip first'));
                }
            }
            const imgPath = data.toString().trim();
            // if the filePath is the real file in system
            // we should keep it instead of removing
            let shouldKeepAfterUploading = false;
            // in macOS if your copy the file in system, it's basename will not equal to our default basename
            if (path.basename(imgPath) !== path.basename(imagePath)) {
                // if the path is not generate by picgo
                // but the path exists, we should keep it
                if (fs.existsSync(imgPath)) {
                    shouldKeepAfterUploading = true;
                }
            }
            // if the imgPath is invalid
            if (imgPath !== 'no image' && !fs.existsSync(imgPath)) {
                return reject(new Error(`Can't find ${imgPath}`));
            }
            resolve({
                imgPath,
                shouldKeepAfterUploading,
            });
        });
    });
};
exports.default = getClipboardImage;
//# sourceMappingURL=get-clipboard-image.js.map