import * as assert from 'assert';
import { buildBucketListCsv } from '../utils/bucket-list-csv';

describe('buildBucketListCsv', () => {
    it('formats a header and one bucket per line', () => {
        const csv = buildBucketListCsv([{ name: 'alpha' }, { name: 'beta' }]);

        assert.strictEqual(csv, 'bucket_name\nalpha\nbeta\n');
    });
});
