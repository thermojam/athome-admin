import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('desktop sidebar uses logo without wordmark', () => {
    const source = readFileSync('components/nav/Sidebar.tsx', 'utf8');
    assert.match(source, /BrandLogo/);
    assert.doesNotMatch(source, />\s*Штаб\s*</);
});

test('app shell includes mobile top bar and bottom tab bar', () => {
    const source = readFileSync('app/(app)/layout.tsx', 'utf8');
    assert.match(source, /MobileTopBar/);
    assert.match(source, /MobileTabBar/);
});
