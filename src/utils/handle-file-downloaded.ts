import { env, MessageOptions, SnippetString, window } from 'vscode';

export const handleFileDownloaded = async (imageLink: string) => {
    const copyOptions = ['Copy Path'];
    const selected = await window.showInformationMessage(
        'File downloaded successfully',
        {
            modal: true,
            detail: imageLink,
        } as MessageOptions,
        ...copyOptions
    );
    let textToCopy = '';
    switch (selected) {
        case copyOptions[0]:
            textToCopy = imageLink;
            break;
    }
    if (textToCopy) {
        await env.clipboard.writeText(textToCopy);
    }
};
