import {z} from 'zod';

// Принимает строки из FormData ('' / '5' / '120') → number.
// Пустая строка трактуется как 0.
function coerceInt(raw: unknown): number|undefined {
    if (raw==null) return undefined;
    const s=String(raw).trim();
    if (s==='') return 0;
    if (!/^\d+$/.test(s)) return undefined;
    return parseInt(s, 10);
}

function coerceIntNullable(raw: unknown): number|null|undefined {
    if (raw==null) return null;
    const s=String(raw).trim();
    if (s==='') return null;
    if (!/^\d+$/.test(s)) return undefined;
    return parseInt(s, 10);
}

const intGTE0=z.preprocess(coerceInt, z.number().int().min(0, 'Целое число ≥ 0'));
const intPercent=z.preprocess(
    coerceIntNullable,
    z.number().int().min(0, 'От 0 до 100').max(100, 'От 0 до 100').nullable(),
);

export const WeeklyStatSchema=z.object({
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата YYYY-MM-DD'),
    leadsReception: intGTE0,
    leadsLifts: intGTE0,
    leadsAvito: intGTE0,
    leadsReferral: intGTE0,
    leadsBase: intGTE0,
    leadsChat: intGTE0,
    trials: intGTE0,
    newRegulars: intGTE0,
    loadPercent: intPercent,
    note: z
        .string()
        .trim()
        .optional()
        .transform((v)=>(v&&v.length>0?v:null)),
});

export type WeeklyStatInput=z.infer<typeof WeeklyStatSchema>;
