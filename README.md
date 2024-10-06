# MinIO VS Code Extension

Ein Minio-Plugin zum schnellen Hochladen von Bildern aus der Zwischenablage oder einer lokalen Datei auf den eigenen Minio-Server in VS Code über Shortcuts.

## Demo

File Explorer:

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/b39e190a4326c29df7cdd4049ec149c218d51f0f/resources/package-explorer.png?raw=true)

Upload from clipboard and from file:

![image](https://minio.mytechsky.top/blog/images/2021122523540483-2021-12-25%2023.49.24.gif)

## Anleitung

Vor der Verwendung müssen Sie die Adresse des MinIO-Servers und den Zugangsschlüssel in den Plugin-Einstellungen konfigurieren.

![image](https://github.com/DrBenjamin/MinIO-VS-Code-Extension/blob/65d2fa6a81a602b5a59860385141dee7f0719598/resources/settings.png?raw=true)

Stellen Sie sicher, dass der konfigurierte Bucket-Name in MinIO existiert, sonst schlägt der Upload fehl.

## Hauptfunktionen

Bild aus der Zwischenablage auf MinIO hochladen, Tastenkürzel: `cmd/ctrl+shift+x`;
Lokale Dateien auf MinIO hochladen, Tastaturkürzel: `cmd/ctrl+shift+z`; `cmd/ctrl+shift+z`.

Das Hochladen kann auch über das Kontextmenü erfolgen

![image](https://minio.mytechsky.top/blog/images/2021122523322162-20211225233220.png)


Nach dem erfolgreichen Hochladen eines Bildes erscheint, wenn kein Markdown-Editor in VS Code aktiv ist, eine Dialogbox, die die Adresse des Bildes / der Datei anzeigt; über diese Dialogbox können Sie auch die Adresse des Bildes in verschiedenen Formaten schnell in die Zwischenablage kopieren; ansonsten wird das Bild automatisch in den Markdown-Editor eingefügt.

![image](https://minio.mytechsky.top/blog/images/2021122523291370-20211225232913.png)