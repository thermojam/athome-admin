import assert from 'node:assert/strict';
import test from 'node:test';
import {computeTrigger} from '@/lib/triggers/compute';
import {groupAndSortTriggers} from '@/lib/today/group';
import {PROFILE_LABELS} from '@/lib/clients/labels';
import {TOUCH_TYPE_LABELS} from '@/lib/touches/labels';
import {PROFILE_SYNONYMS} from '@/lib/csv/synonyms';
import {buildClaudeExport} from '@/lib/export/claude';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

const EMOJI = /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2600-\u27BF\u3030\u303D\u3297\u3299\uFE0F\u{1F000}-\u{1FAFF}]/u;

test('trigger and group models contain no presentation field', () => {
    const trigger = computeTrigger(
        {status: 'lead', septemberBooking: false, deletedAt: null},
        new Date('2026-06-01T00:00:00Z'),
        new Date('2026-06-24T00:00:00Z'),
        DEFAULT_THRESHOLDS,
    );
    assert.ok(trigger);
    assert.equal('emoji' in trigger, false);

    const groups = groupAndSortTriggers([{
        id: 'client-1',
        trainerId: 'trainer-1',
        name: 'Анна',
        contact: null,
        profile: 'health',
        status: 'lead',
        source: null,
        personalFact: null,
        goal: null,
        sessionsPerWeek: null,
        lastSessionDate: null,
        septemberBooking: false,
        note: null,
        leadPayload: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        updatedAt: new Date('2026-06-01T00:00:00Z'),
        deletedAt: null,
        lastTouchDate: new Date('2026-06-01T00:00:00Z'),
    }], new Date('2026-06-24T00:00:00Z'), DEFAULT_THRESHOLDS);
    assert.equal('emoji' in groups[0], false);
});

test('labels, CSV synonyms and Claude export are plain text', () => {
    for (const label of [...Object.values(PROFILE_LABELS), ...Object.values(TOUCH_TYPE_LABELS)]) {
        assert.equal(EMOJI.test(label), false, label);
    }
    for (const synonym of Object.keys(PROFILE_SYNONYMS)) {
        assert.equal(EMOJI.test(synonym), false, synonym);
    }

    const result = buildClaudeExport([{
        id: 'client-1',
        name: 'Анна',
        profile: 'health',
        personalFact: 'любит утренние тренировки',
        goal: 'сила',
        note: null,
        trigger: {kind: 'active_stale', priority: 'medium', daysSince: 12} as Parameters<typeof buildClaudeExport>[0][number]['trigger'],
    }], 'PROMPT');
    assert.equal(EMOJI.test(result.text), false);
    assert.match(result.text, /Анна · Здоровье · Активный без тренировки/);
});
