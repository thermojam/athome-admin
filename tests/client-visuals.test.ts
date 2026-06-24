import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {TOUCH_TYPE_ICONS} from '@/components/brand/semantic-icons';

test('all touch types have Lucide mappings', () => {
    assert.deepEqual(Object.keys(TOUCH_TYPE_ICONS).sort(), ['call', 'message', 'other', 'training']);
});

test('client pages use shared page headers and notices', () => {
    assert.match(readFileSync('app/(app)/clients/page.tsx', 'utf8'), /PageHeader/);
    assert.match(readFileSync('app/(app)/clients/[id]/page.tsx', 'utf8'), /StatusNotice/);
});
