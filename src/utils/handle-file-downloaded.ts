import { env, MessageOptions, window } from 'vscode';

export const handleFileDownloaded = async (fileLink: string) => {
    const copyOptions = ['Copy file name'];
    const selected = await window.showInformationMessage(
        'File downloaded successfully',
        {
            modal: true,
            detail: fileLink,
        } as MessageOptions,
        ...copyOptions
    );
    let textToCopy = '';
    switch (selected) {
        case copyOptions[0]:
            textToCopy = fileLink;
            break;
    }
    if (textToCopy) {
        await env.clipboard.writeText(textToCopy);
    }
};
