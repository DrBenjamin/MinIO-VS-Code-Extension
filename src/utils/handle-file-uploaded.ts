import { env, MessageOptions, window, workspace } from 'vscode';

export const handleFileUploaded = async (fileLink: string) => {
    const notificationsConfig = workspace.getConfiguration('minio.minio.notifications');
    const showSuccessPopups = notificationsConfig.get<boolean>('showSuccessPopups', true);

    if (!showSuccessPopups) {
        await env.clipboard.writeText(fileLink);
        return;
    }

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
