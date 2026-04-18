# MinIO VS Code Extension

A MinIO plugin for quickly uploading, downloading or deleting files to a Minio server for VS Code. Find the plugin on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=seriousbenentertainment.minio).

## Instructions

Before use, you must configure the address of the MinIO server and the access and secret key in the plugin settings.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/efa41e693871ca1fee0f67205cbec8556e543a5a/resources/settings.png?raw=true)

## Main Features

All available features of the MinIO Extension.

### MinIO Explorer

The MinIO Explorer will show all buckets, folders and files from the configured MinIO endpoint. You can upload, download and delete files from the MinIO server.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/efa41e693871ca1fee0f67205cbec8556e543a5a/resources/MinIO%20Explorer.png?raw=true)

### File uploading

Upload local files to MinIO by clicking the upload button on a selected bucket or subfolder or using the keyboard shortcut: `cmd/ctrl+shift+z`; `cmd/ctrl+shift+z`. After successfully uploading a file or multiple files at once, a dialog box appears showing the address of the (first) file. You can use this dialog box to quickly copy this address.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/22318ac247625080dcf3900f85785840b0aa8d2a/resources/Uploaded.png?raw=true)

### File downloading

Download a file or multiple files at once from MinIO with clicking the download button on a specific file. After successfully downloading a file, a dialog box appears showing the full local file path. You can use this dialog box to quickly copy this path.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/22318ac247625080dcf3900f85785840b0aa8d2a/resources/Downloaded.png?raw=true)

### File deleting

Delete files from MinIO with clicking the delete button on a specific file.

### File URL copying

Copy the URL of a file to the clipboard by clicking the copy button on a specific file.

### Notifications

You can disable success popup messages for upload, download, and copy actions with the setting `minio.minio.notifications.showSuccessPopups`.
When disabled, the path or URL value is still copied directly to your clipboard.

### Bucket and folder creation

Create buckets and folders by clicking the create button on the MinIO Explorer at the respective locations.