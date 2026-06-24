import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {TRIGGER_GROUP_VISUALS, TRIGGER_KIND_VISUALS} from '@/components/brand/semantic-icons';

test('all trigger groups and kinds have explicit visuals', () => {
    assert.deepEqual(Object.keys(TRIGGER_GROUP_VISUALS).sort(), ['high', 'low', 'medium', 'silent']);
    assert.deepEqual(Object.keys(TRIGGER_KIND_VISUALS).sort(), [
        'active_stale',
        'cooled_stale',
        'lead_stale',
        'silent',
        'vacation_no_prebook',
    ]);
});

test('TodayBoard consumes semantic mappings instead of presentation data', () => {
    const source = readFileSync('components/today/TodayBoard.tsx', 'utf8');
    assert.match(source, /TRIGGER_GROUP_VISUALS/);
    assert.match(source, /TRIGGER_KIND_VISUALS/);
    assert.match(source, /IconBadge/);
});
