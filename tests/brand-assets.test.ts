import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync, readFileSync} from 'node:fs';

test('brand favicon and SVG component exist', () => {
    assert.equal(existsSync('public/favicon.png'), true);
    assert.equal(existsSync('components/brand/BrandLogo.tsx'), true);
});

test('BrandLogo is a real inline SVG using the source aspect ratio', () => {
    const source = readFileSync('components/brand/BrandLogo.tsx', 'utf8');
    assert.match(source, /<svg/);
    assert.match(source, /viewBox="0 0 82 81"/);
    assert.doesNotMatch(source, /<img|next\/image/);
});

test('root metadata references the PNG favicon', () => {
    const source = readFileSync('app/layout.tsx', 'utf8');
    assert.match(source, /icons:\s*\{[\s\S]*?icon:\s*'\/favicon\.png'/);
});
