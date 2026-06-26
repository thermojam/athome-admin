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

test('mobile top bar exposes a logout action', () => {
    const source = readFileSync('components/nav/MobileTopBar.tsx', 'utf8');
    assert.match(source, /signOut/);
    assert.match(source, /aria-label="Выйти"/);
    assert.match(source, /LogOut/);
});

test('auth screens render the brand logo and strong card', () => {
    for (const file of ['app/(auth)/login/page.tsx', 'app/(auth)/register/page.tsx']) {
        const source = readFileSync(file, 'utf8');
        assert.match(source, /BrandLogo/);
        assert.match(source, /variant="strong"/);
    }
});

test('login auth screen uses a status notice for errors', () => {
    const source = readFileSync('app/(auth)/login/page.tsx', 'utf8');
    assert.match(source, /StatusNotice/);
    assert.match(source, /tone="error"/);
});

test('auth layout centers cards on mobile as well as desktop', () => {
    const source = readFileSync('app/(auth)/layout.tsx', 'utf8');
    assert.match(source, /className="[^"]*\bgrid\b[^"]*\bplace-items-center\b/);
    assert.doesNotMatch(source, /md:grid|md:place-items-center/);
});
