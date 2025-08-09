# Copilot Instructions for MINIO VS Code Extension

Dearest Copilot,
this project is a VS Code extension that integrates [MinIO JavaScript 
Library for Amazon S3 Compatible Cloud Storage]|(https://github.com/minio/minio-js). 
When generating code snippets or explanations. It is written in JS/TS. 

Please follow these guidelines:

1. Output code in the chat always in Markdown.

2. Files and Folders are described here (when referring to a file in this repo in the chat, use the format `#file:<relative_path>`):
   - metadata and configuration: #file:package.json — Project manifest and settings
   - TypeScript config: #file:tsconfig.json — Compiler options and build output
   - Extension entry point: #file:extension.ts — Activates extension and registers commands
   - Core model & explorer: #file:src/minio.ts — Defines MinIOModel and TreeDataProvider
   - Commands:
     - Upload: #file:src/commands/upload.ts — Selects and uploads local files
     - Download: #file:src/commands/download.ts — Downloads MinIO files locally
     - Copy URL: #file:src/commands/copy.ts — Copies MinIO file URL to clipboard
     - Delete: #file:src/commands/delete.ts — Deletes files from MinIO
   - Models:
     - Configuration: #file:src/models/minio-configuration.ts — Holds MinIO settings
     - Clipboard image: #file:src/models/clipboard-image.ts — Represents clipboard image data
   - Services:
     - Upload service: #file:src/services/upload.service.ts — Implements upload logic
     - Download service: #file:src/services/download.service.ts — Implements download logic
     - Delete service: #file:src/services/delete.service.ts — Implements delete logic
     - Client factory: #file:src/services/minio-client-factory.service.ts — Builds MinIO clients
     - Config provider: #file:src/services/minio-configuration-prodiver.service.ts — Reads extension settings
   - Utilities:
     - App context: #file:src/utils/app-context.ts — Stores and provides extension context
     - Handle uploaded: #file:src/utils/handle-file-uploaded.ts — UI feedback for uploads
     - Handle downloaded: #file:src/utils/handle-file-downloaded.ts — UI feedback for downloads
     - Handle copied: #file:src/utils/handle-file-copyied.ts — UI feedback for copy URL

3. Code‑block format for changes or new files:
    ```typescript
    // filepath: <relative_path>
    // ...existing code...
    public connect(): Promise<Minio.Client> {
        return Promise.resolve(this.minioClient);
    }
    // ...existing code...
    ```

4. Adhere to TypeScript best practices:
   - Use 2-space indentation, camelCase for variable and function names,
     and PascalCase for class and interface names.
   - Place imports at the top of the file.
   - Use JSDoc-style comments for functions, classes, and interfaces.
   - Prefer `const` and `let` over `var`.
   - Enable strict typing and avoid using `any` unless absolutely necessary.

5. Preserve existing patterns:
   - Use dependency injection for services and utilities.
   - Store and retrieve state via a centralized state management utility or context.
   - Build MinIO client sessions with `MinioClientFactoryService` in [minio-client-factory.service.ts](src/services/minio-client-factory.service.ts).
   - Leverage `MinioConfigurationProvider` for configuration management in [minio-configuration-prodiver.service.ts](src/services/minio-configuration-prodiver.service.ts).