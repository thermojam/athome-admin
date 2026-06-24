import {notFound} from 'next/navigation';
import {CircleAlert, CircleCheck} from 'lucide-react';
import {buildClaudeExport} from '@/lib/export/claude';
import {EXPORT_SANITY_CASES, SANITY_PROMPT} from '@/lib/export/sanity-cases';
import {PageHeader} from '@/components/ui/PageHeader';

export default function ExportSanityPage() {
    if (process.env.NODE_ENV !== 'development') notFound();

    const rows = EXPORT_SANITY_CASES.map((c) => {
        const {text, missing} = buildClaudeExport(c.selected, SANITY_PROMPT);
        const expectedMissing = [...c.expectedMissingNames].sort().join(',');
        const actualMissing = missing.map((m) => m.name).sort().join(',');
        const missingOk = expectedMissing === actualMissing;
        const textHasOk = c.expectedTextHas.every((s) => text.includes(s));
        const noContactOk = !text.includes('@') && !text.includes('+7');
        return {c, text, missing, missingOk, textHasOk, noContactOk, allOk: missingOk && textHasOk && noContactOk};
    });

    const passed = rows.filter((r) => r.allOk).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Export sanity"
                kicker="Development only"
                meta={`${passed} / ${rows.length} прошло`}
            />
            <div className="flex flex-col gap-4">
                {rows.map((r, i) => (
                    <div key={i} className="glass glass-strong p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[14px]">{r.c.title}</span>
                            {r.allOk ? (
                                <CircleCheck size={17} className="text-green" aria-label="Пройдено"/>
                            ) : (
                                <CircleAlert size={17} className="text-orange" aria-label="Ошибка"/>
                            )}
                        </div>
                        <div className="text-[12px] font-mono text-tx-2 grid grid-cols-3 gap-2 mb-2">
                            <div>missing совпадает: {r.missingOk ? 'Пройдено' : 'Ошибка'}</div>
                            <div>текст содержит ожидаемое: {r.textHasOk ? 'Пройдено' : 'Ошибка'}</div>
                            <div>контакт не утёк: {r.noContactOk ? 'Пройдено' : 'Ошибка'}</div>
                        </div>
                        <pre className="text-[12px] font-mono text-tx-2 whitespace-pre-wrap bg-bg-3 p-3 rounded-[var(--radius-sm)]">{r.text || '— пусто —'}</pre>
                        {r.missing.length > 0 && (
                            <div className="text-[12px] font-mono text-tx-3 mt-2">
                                missing: {r.missing.map((m) => m.name).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
