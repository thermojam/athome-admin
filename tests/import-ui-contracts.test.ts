import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('import page uses shared page header and has no local page padding', () => {
    const source = readFileSync('app/(app)/clients/import/page.tsx', 'utf8');
    assert.match(source, /PageHeader/);
    assert.doesNotMatch(source, /className="p-6 max-w-3xl/);
});

test('import page uses shared status notice states', () => {
    const source = readFileSync('app/(app)/clients/import/page.tsx', 'utf8');
    assert.match(source, /StatusNotice/);
});

test('dropzone uses a real upload icon', () => {
    assert.match(readFileSync('components/import/ImportDropzone.tsx', 'utf8'), /Upload/);
});

test('error list and report use shared status notice', () => {
    assert.match(readFileSync('components/import/ImportErrorList.tsx', 'utf8'), /StatusNotice/);
    assert.match(readFileSync('components/import/ImportReport.tsx', 'utf8'), /StatusNotice/);
});

test('preview table uses branded glass shell', () => {
    assert.match(readFileSync('components/import/ImportPreviewTable.tsx', 'utf8'), /glass glass-strong/);
});
