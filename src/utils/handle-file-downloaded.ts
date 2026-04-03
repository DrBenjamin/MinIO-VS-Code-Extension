import { env, MessageOptions, window, workspace } from 'vscode';

export const handleFileDownloaded = async (downloadedFilePath: string) => {
    const notificationsConfig = workspace.getConfiguration('minio.minio.notifications');
    const showSuccessPopups = notificationsConfig.get<boolean>('showSuccessPopups', true);

    if (!showSuccessPopups) {
        await env.clipboard.writeText(downloadedFilePath);
        return;
    }

    const copyOptions = ['Copy file path'];
    const selected = await window.showInformationMessage(
        'File downloaded successfully',
        {
            modal: true,
            detail: downloadedFilePath,
        } as MessageOptions,
        ...copyOptions
    );
    let textToCopy = '';
    switch (selected) {
        case copyOptions[0]:
            textToCopy = downloadedFilePath;
            break;
    }
    if (textToCopy) {
        await env.clipboard.writeText(textToCopy);
    }
};
