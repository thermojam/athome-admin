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

test('clients page header CTA is omitted in the true empty state', () => {
    const source = readFileSync('app/(app)/clients/page.tsx', 'utf8');
    assert.match(source, /<PageHeader[\s\S]*\{\.\.\.\(isEmpty \? \{\} : \{\s*action: headerAction\s*\}\)\}/);
    assert.match(source, /Импортируй таблицу/);
    assert.match(source, /<Button variant="secondary" size="md">\+ Клиент<\/Button>/);
});
