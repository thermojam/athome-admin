import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('dashboard and settings pages use shared page headers', () => {
    assert.match(readFileSync('app/(app)/dashboard/page.tsx', 'utf8'), /PageHeader/);
    assert.match(readFileSync('app/(app)/settings/page.tsx', 'utf8'), /PageHeader/);
});

test('dashboard and settings forms use shared surfaces and notices', () => {
    assert.match(readFileSync('components/dashboard/WeeklyForm.tsx', 'utf8'), /Card/);
    assert.match(readFileSync('components/dashboard/WeeklyForm.tsx', 'utf8'), /Textarea/);
    assert.match(readFileSync('components/dashboard/WeeklyForm.tsx', 'utf8'), /Input/);
    assert.match(readFileSync('components/dashboard/WeeklyHistoryTable.tsx', 'utf8'), /glass glass-strong overflow-x-auto/);
    assert.match(readFileSync('components/settings/SettingsForms.tsx', 'utf8'), /StatusNotice/);
});

test('dashboard counters use semantic visuals and settings buttons keep the CTA hierarchy', () => {
    const counters = readFileSync('components/dashboard/CountersBlock.tsx', 'utf8');
    assert.match(counters, /IconBadge/);
    assert.match(counters, /TRIGGER_GROUP_VISUALS/);

    const settings = readFileSync('components/settings/SettingsForms.tsx', 'utf8');
    assert.match(settings, /variant="primary"/);
    assert.match(settings, /variant="secondary"/);
});

test('sanity pages use semantic status icons', () => {
    for (const file of [
        'app/(app)/dev/triggers-sanity/page.tsx',
        'app/(app)/dev/export-sanity/page.tsx',
        'app/(app)/dev/dashboard-sanity/page.tsx',
        'app/(app)/dev/import-sanity/page.tsx',
    ]) {
        const source = readFileSync(file, 'utf8');
        assert.match(source, /CircleCheck/);
        assert.match(source, /CircleAlert/);
    }
});
