import { env, MessageOptions, SnippetString, window } from 'vscode';

export const handleFileUploaded = async (fileLink: string) => {
    const copyOptions = ['Copy File Link'];
    const selected = await window.showInformationMessage(
        'File uploaded successfully',
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
