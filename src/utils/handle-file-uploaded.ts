import { env, MessageOptions, SnippetString, window } from 'vscode';

export const handleImageUploaded = async (imageLink: string) => {
    const copyOptions = ['Copy File Link'];
    const selected = await window.showInformationMessage(
        'File uploaded successfully',
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
