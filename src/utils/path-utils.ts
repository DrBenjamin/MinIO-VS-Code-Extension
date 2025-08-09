import * as vscode from 'vscode';

/**
 * Extract bucket and object name from a resource Uri produced by this extension.
 * Handles both the new (sanitized) and a legacy format where the first segment
 * might accidentally include host:port.
 */
export function extractBucketAndObject(resource: vscode.Uri): { bucket: string; object: string } {
    const segments = resource.path.split('/').filter(s => s.length > 0);
    if (segments.length === 0) {
        return { bucket: '', object: '' };
    }
    if (segments[0].includes(':') && segments.length > 1) {
        return {
            bucket: segments[1],
            object: segments.slice(2).join('/')
        };
    }
    return {
        bucket: segments[0],
        object: segments.slice(1).join('/')
    };
}
