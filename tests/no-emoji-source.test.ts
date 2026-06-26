import assert from 'node:assert/strict';
import test from 'node:test';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {extname, join} from 'node:path';

const EMOJI = /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2600-\u27BF\u3030\u303D\u3297\u3299\uFE0F\u{1F000}-\u{1FAFF}]/u;
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.mjs', '.md', '.json']);
const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.next',
    '.superpowers',
    'node_modules',
    'public',
    'graphify-out',
]);
const ROOTS = ['.'];

function collect(path: string): string[] {
    if (statSync(path).isFile()) return TEXT_EXTENSIONS.has(extname(path)) ? [path] : [];
    return readdirSync(path).flatMap((name) => {
        if (IGNORED_DIRECTORIES.has(name)) return [];
        return collect(join(path, name));
    });
}

test('product source contains no Unicode emoji', () => {
    const hits = ROOTS.flatMap(collect).flatMap((file) => {
        const lines = readFileSync(file, 'utf8').split('\n');
        return lines.flatMap((line, index) => EMOJI.test(line) ? [`${file}:${index + 1}`] : []);
    });
    assert.deepEqual(hits, []);
});
