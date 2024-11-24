import { env, MessageOptions, window, Uri } from 'vscode';

export const handleFileCopyied = async (fileLink: string) => {
    //const fileLinkPath = JSON.parse(JSON.stringify(fileLink)).resource.path
    const copyOptions = ['Copy file URL'];
    const selected = await window.showInformationMessage(
        'File URL',
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
