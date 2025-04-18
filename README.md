# MinIO VS Code Extension

A MinIO plugin for quickly uploading, downloading or deleting images on a Minio server in VS Code. Find the plugin on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=seriousbenentertainment.minio).

## Instructions

Before use, you must configure the address of the MinIO server and the access key in the plugin settings.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/22318ac247625080dcf3900f85785840b0aa8d2a/resources/settings.png?raw=true)

Make sure that the configured bucket name exists in MinIO, otherwise the upload will fail.

## Main Features

All features are available in the MinIO Extension.

### MinIO Explorer

Thee MinIO Explorer shows all files in the configured bucket. You can upload, download or delete files from the MinIO server.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/22318ac247625080dcf3900f85785840b0aa8d2a/resources/MinIO%20Explorer.png?raw=true)

### File uploading

Upload local files to MinIO by clicking the upload button or using the keyboard shortcut: `cmd/ctrl+shift+z`; `cmd/ctrl+shift+z`. After successfully uploading a file, a dialogue box appears showing the address of the file. You can use this dialogue box to quickly copy this address.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/22318ac247625080dcf3900f85785840b0aa8d2a/resources/Uploaded.png?raw=true)

### File downloading

Download files from MinIO with clicking the download button on a specific file. After successfully downloading a file, a dialogue box appears showing the address of the local file. You can use this dialogue box to quickly copy this address.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/22318ac247625080dcf3900f85785840b0aa8d2a/resources/Downloaded.png?raw=true)

### File deleting

Delete files from MinIO with clicking the delete button on a specific file.

### File URL copying

Copy the URL of a file to the clipboard by clicking the copy button on a specific file.