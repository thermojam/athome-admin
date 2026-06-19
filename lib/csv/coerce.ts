import {BOOL_TRUE, BOOL_FALSE} from './synonyms';

export type CoerceResult<T> = {ok: true; value: T} | {ok: false; reason: string};

export function coerceString(raw: unknown): string {
    if (raw == null) return '';
    return String(raw).trim();
}

export function coerceBool(raw: unknown): CoerceResult<boolean> {
    const s = coerceString(raw).toLowerCase();
    if (BOOL_TRUE.has(s)) return {ok: true, value: true};
    if (BOOL_FALSE.has(s)) return {ok: true, value: false};
    return {ok: false, reason: `Не похоже на bool: "${s}"`};
}

export function coerceInt(raw: unknown): CoerceResult<number | null> {
    const s = coerceString(raw);
    if (s === '') return {ok: true, value: null};
    if (!/^-?\d+$/.test(s)) return {ok: false, reason: `Не целое число: "${s}"`};
    return {ok: true, value: parseInt(s, 10)};
}

export function coerceEnum<T extends string>(
    raw: unknown,
    synonyms: Record<string, T>,
    label: string,
): CoerceResult<T | null> {
    const s = coerceString(raw).toLowerCase();
    if (s === '') return {ok: true, value: null};
    const hit = synonyms[s];
    if (!hit) return {ok: false, reason: `Неизвестное значение для ${label}: "${s}"`};
    return {ok: true, value: hit};
}

export function coerceDate(raw: unknown): CoerceResult<string | null> {
    const s = coerceString(raw);
    if (s === '') return {ok: true, value: null};

    if (/^\d+(\.\d+)?$/.test(s)) {
        const serial = parseInt(s, 10);
        const ms = (serial - 25569) * 86400 * 1000;
        const d = new Date(ms);
        if (Number.isNaN(d.getTime())) return {ok: false, reason: `Неверный Excel serial: "${s}"`};
        return {ok: true, value: formatIsoDate(d)};
    }

    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (iso) {
        const [, y, m, d] = iso;
        return validateYmd(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10), s);
    }

    const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/.exec(s);
    if (dmy) {
        const day = parseInt(dmy[1], 10);
        const mon = parseInt(dmy[2], 10);
        let year = parseInt(dmy[3], 10);
        if (dmy[3].length === 2) year = year <= 29 ? 2000 + year : 1900 + year;
        return validateYmd(year, mon, day, s);
    }

    return {ok: false, reason: `Не распознан формат даты: "${s}"`};
}

function validateYmd(y: number, m: number, d: number, src: string): CoerceResult<string> {
    if (m < 1 || m > 12 || d < 1 || d > 31) return {ok: false, reason: `Неверная дата: "${src}"`};
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
        return {ok: false, reason: `Неверная дата: "${src}"`};
    }
    return {ok: true, value: formatIsoDate(dt)};
}

function formatIsoDate(d: Date): string {
    const y = d.getUTCFullYear().toString().padStart(4, '0');
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
}
