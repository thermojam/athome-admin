import {parseCsvText} from '@/lib/csv/parse';
import {validateRow} from '@/lib/csv/validate';
import {SANITY_CASES} from '@/lib/csv/sanity-cases';
import type {SanityCase} from '@/lib/csv/sanity-cases';

type CaseResult = {ok: boolean; details: string};

function runCase(c: SanityCase): CaseResult {
    const parsed = parseCsvText(c.csv);

    if (c.expected.kind === 'file_error') {
        if (parsed.kind !== 'file_error') return {ok: false, details: `Ожидали file_error, получили ok с ${parsed.rows.length} строк.`};
        const has = parsed.message.includes(c.expected.messageContains);
        return {ok: has, details: parsed.message};
    }

    if (parsed.kind === 'file_error') return {ok: false, details: `Ожидали ok, получили file_error: ${parsed.message}`};

    const exp = c.expected;
    if (exp.expectRowCount !== undefined && parsed.rows.length !== exp.expectRowCount) {
        return {ok: false, details: `Строк: ${parsed.rows.length}, ожидали ${exp.expectRowCount}.`};
    }

    const validated = parsed.rows.map((r, i) => validateRow(r, i + 2));

    if (exp.expectErrors !== undefined) {
        const allErrors = validated.flatMap((v) => (v.ok ? [] : v.errors));
        for (const e of exp.expectErrors) {
            const hit = allErrors.find((a) =>
                (e.lineNo === undefined || a.lineNo === e.lineNo) &&
                (e.field === undefined || a.field === e.field),
            );
            if (!hit) return {ok: false, details: `Не найдена ошибка ${JSON.stringify(e)}. Все: ${JSON.stringify(allErrors)}`};
        }
        return {ok: true, details: `Ошибок: ${allErrors.length}`};
    }

    if (exp.expectFirstRow !== undefined) {
        const first = validated[0];
        if (!first.ok) return {ok: false, details: `Первая строка с ошибками: ${JSON.stringify(first.errors)}`};
        for (const [k, v] of Object.entries(exp.expectFirstRow)) {
            const actual = (first.row as Record<string, unknown>)[k];
            if (actual !== v) return {ok: false, details: `Поле ${k}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(v)}`};
        }
        return {ok: true, details: `Поля совпали`};
    }

    return {ok: true, details: `ok (${parsed.rows.length} строк)`};
}

export default function ImportSanityPage() {
    const results = SANITY_CASES.map((c) => ({c, r: runCase(c)}));
    const passed = results.filter(({r}) => r.ok).length;

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-2xl font-semibold mb-2">Import sanity</h1>
            <p className="mb-4 text-zinc-600">{passed}/{results.length} зелёных.</p>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b text-left">
                        <th className="py-2 pr-3 w-12">#</th>
                        <th className="py-2 pr-3">Кейс</th>
                        <th className="py-2 pr-3 w-20">Статус</th>
                        <th className="py-2 pr-3">Детали</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(({c, r}, i) => (
                        <tr key={c.id} className="border-b align-top">
                            <td className="py-2 pr-3 text-zinc-400">{i + 1}</td>
                            <td className="py-2 pr-3">{c.label}</td>
                            <td className="py-2 pr-3">{r.ok ? '✅' : '❌'}</td>
                            <td className="py-2 pr-3 font-mono text-xs">{r.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
