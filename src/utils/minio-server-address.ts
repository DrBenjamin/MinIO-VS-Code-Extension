const DEFAULT_MINIO_PORT = 9000;

export interface ParsedMinioServerAddress {
    endPoint: string;
    port?: number;
    useSSL: boolean;
}

/**
 * Normalizes common URL typos in user-provided MinIO endpoints.
 */
export function normalizeServerAddress(serverAddress: string): string {
    const trimmed = serverAddress.trim();
    if (!trimmed) {
        return '';
    }

    // Common typo: http:/host or https:/host
    return trimmed.replace(/^(https?):\/(?!\/)/i, '$1://');
}

/**
 * Parses MinIO server address into client options.
 */
export function parseMinioServerAddress(serverAddress: string): ParsedMinioServerAddress {
    const normalized = normalizeServerAddress(serverAddress);
    if (!normalized) {
        return {
            endPoint: '',
            useSSL: false,
        };
    }

    const hasScheme = /^(https?:\/\/)/i.test(normalized);
    const candidate = hasScheme ? normalized : `http://${normalized}`;

    try {
        const url = new URL(candidate);
        const parsedPort = url.port ? parseInt(url.port, 10) : undefined;

        return {
            endPoint: url.hostname,
            useSSL: url.protocol === 'https:',
            port: Number.isFinite(parsedPort)
                ? parsedPort
                : hasScheme
                ? url.protocol === 'https:'
                    ? 443
                    : 80
                : DEFAULT_MINIO_PORT,
        };
    } catch {
        const hostAndPort = normalized.match(/^([^/:]+):(\d+)$/);
        if (hostAndPort) {
            return {
                endPoint: hostAndPort[1],
                useSSL: false,
                port: parseInt(hostAndPort[2], 10),
            };
        }

        return {
            endPoint: normalized.replace(/\/+$/, ''),
            useSSL: false,
            port: DEFAULT_MINIO_PORT,
        };
    }
}
