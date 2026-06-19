import Papa from 'papaparse';
import {CANONICAL_HEADERS, HEADER_TO_KEY, REQUIRED_HEADERS} from './synonyms';

export const MAX_ROWS = 5000;
export const MAX_BYTES = 2 * 1024 * 1024;

export type RawRow = Record<string, string>;

export type ParseResult =
    | {kind: 'file_error'; message: string}
    | {kind: 'ok'; rows: RawRow[]};

export function decodeFile(buf: ArrayBuffer): string {
    try {
        return new TextDecoder('utf-8', {fatal: true}).decode(buf);
    } catch (e) {
        if (e instanceof TypeError) {
            return new TextDecoder('windows-1251').decode(buf);
        }
        throw e;
    }
}

export function parseCsvText(text: string): ParseResult {
    if (text.length === 0) return {kind: 'file_error', message: 'Файл пустой.'};

    const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
        const first = result.errors[0];
        return {kind: 'file_error', message: `Ошибка парсинга CSV: ${first.message}`};
    }

    const headers = result.meta.fields ?? [];
    for (const required of REQUIRED_HEADERS) {
        if (!headers.includes(required)) {
            return {kind: 'file_error', message: `Отсутствует обязательная колонка: "${required}"`};
        }
    }

    if (result.data.length > MAX_ROWS) {
        return {kind: 'file_error', message: `Слишком много строк: ${result.data.length} (лимит ${MAX_ROWS})`};
    }

    const knownHeaders = headers.filter((h): h is typeof CANONICAL_HEADERS[number] =>
        (CANONICAL_HEADERS as readonly string[]).includes(h),
    );

    const rows: RawRow[] = result.data.map((raw) => {
        const mapped: RawRow = {};
        for (const header of knownHeaders) {
            const key = HEADER_TO_KEY[header];
            mapped[key] = (raw[header] ?? '').toString();
        }
        return mapped;
    });

    return {kind: 'ok', rows};
}
