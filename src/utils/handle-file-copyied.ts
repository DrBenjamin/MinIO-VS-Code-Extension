import { env, MessageOptions, window, workspace } from 'vscode';

export const handleFileCopyied = async (fileLink: string) => {
    const notificationsConfig = workspace.getConfiguration('minio.minio.notifications');
    const showSuccessPopups = notificationsConfig.get<boolean>('showSuccessPopups', true);

    if (!showSuccessPopups) {
        await env.clipboard.writeText(fileLink);
        return;
    }

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
