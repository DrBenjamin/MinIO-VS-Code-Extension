export interface BucketListEntry {
    name: string;
}

export function buildBucketListCsv(buckets: readonly BucketListEntry[]): string {
    const lines = ['bucket_name', ...buckets.map((bucket) => bucket.name)];
    return `${lines.join('\n')}\n`;
}
