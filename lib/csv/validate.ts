import type {ClientProfile, ClientStatus, ClientSource, TouchType} from '@/lib/db/schema';
import {coerceBool, coerceDate, coerceEnum, coerceInt, coerceString} from './coerce';
import {STATUS_SYNONYMS, PROFILE_SYNONYMS, SOURCE_SYNONYMS, TOUCH_TYPE_SYNONYMS} from './synonyms';
import type {RawRow} from './parse';

export type CsvRow = {
    name: string;
    contact: string | null;
    profile: ClientProfile | null;
    status: ClientStatus;
    source: ClientSource | null;
    personalFact: string | null;
    goal: string | null;
    sessionsPerWeek: number | null;
    lastSessionDate: string | null;
    septemberBooking: boolean;
    note: string | null;
    lastTouchDate: string | null;
    lastTouchType: TouchType | null;
    createdAt: string | null;
    deletedAt: string | null;
};

export type RowError = {lineNo: number; field: string; message: string};

export type ValidateResult =
    | {ok: true; row: CsvRow}
    | {ok: false; errors: RowError[]};

export function validateRow(raw: RawRow, lineNo: number): ValidateResult {
    const errors: RowError[] = [];
    const push = (field: string, message: string) => errors.push({lineNo, field, message});

    const name = coerceString(raw.name);
    if (name === '') push('name', 'Имя обязательно');

    const contact = coerceString(raw.contact);

    const profile = coerceEnum<ClientProfile>(raw.profile, PROFILE_SYNONYMS, 'профиля');
    if (!profile.ok) push('profile', profile.reason);

    const status = coerceEnum<ClientStatus>(raw.status, STATUS_SYNONYMS, 'статуса');
    if (!status.ok) push('status', status.reason);
    else if (status.value === null) push('status', 'Статус обязателен');

    const source = coerceEnum<ClientSource>(raw.source, SOURCE_SYNONYMS, 'источника');
    if (!source.ok) push('source', source.reason);

    const sessions = coerceInt(raw.sessionsPerWeek);
    if (!sessions.ok) push('sessionsPerWeek', sessions.reason);
    else if (sessions.value !== null && (sessions.value < 0 || sessions.value > 7)) {
        push('sessionsPerWeek', 'Должно быть 0–7');
    }

    const lastSession = coerceDate(raw.lastSessionDate);
    if (!lastSession.ok) push('lastSessionDate', lastSession.reason);

    const septemberBooking = coerceBool(raw.septemberBooking);
    if (!septemberBooking.ok) push('septemberBooking', septemberBooking.reason);

    const lastTouchDate = coerceDate(raw.lastTouchDate);
    if (!lastTouchDate.ok) push('lastTouchDate', lastTouchDate.reason);

    const lastTouchType = coerceEnum<TouchType>(raw.lastTouchType, TOUCH_TYPE_SYNONYMS, 'типа касания');
    if (!lastTouchType.ok) push('lastTouchType', lastTouchType.reason);

    const createdAt = coerceDate(raw.createdAt);
    if (!createdAt.ok) push('createdAt', createdAt.reason);

    const deletedAt = coerceDate(raw.deletedAt);
    if (!deletedAt.ok) push('deletedAt', deletedAt.reason);

    if (errors.length > 0) return {ok: false, errors};

    return {
        ok: true,
        row: {
            name,
            contact: contact === '' ? null : contact,
            profile: profile.ok ? profile.value : null,
            status: (status.ok ? status.value : null) as ClientStatus,
            source: source.ok ? source.value : null,
            personalFact: nullIfEmpty(coerceString(raw.personalFact)),
            goal: nullIfEmpty(coerceString(raw.goal)),
            sessionsPerWeek: sessions.ok ? sessions.value : null,
            lastSessionDate: lastSession.ok ? lastSession.value : null,
            septemberBooking: septemberBooking.ok ? septemberBooking.value : false,
            note: nullIfEmpty(coerceString(raw.note)),
            lastTouchDate: lastTouchDate.ok ? lastTouchDate.value : null,
            lastTouchType: lastTouchType.ok ? lastTouchType.value : null,
            createdAt: createdAt.ok ? createdAt.value : null,
            deletedAt: deletedAt.ok ? deletedAt.value : null,
        },
    };
}

function nullIfEmpty(s: string): string | null {
    return s === '' ? null : s;
}
