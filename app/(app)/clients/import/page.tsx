'use client';

import {useState, useTransition} from 'react';
import {previewImport, commitImport} from '@/lib/clients/import';
import type {PreviewResult, CommitResult} from '@/lib/clients/import';
import {Button} from '@/components/ui/Button';
import {ImportDropzone} from '@/components/import/ImportDropzone';
import {ImportPreviewTable} from '@/components/import/ImportPreviewTable';
import {ImportErrorList} from '@/components/import/ImportErrorList';
import {ImportReport} from '@/components/import/ImportReport';
import {PageHeader} from '@/components/ui/PageHeader';
import {StatusNotice} from '@/components/ui/StatusNotice';

type Phase =
    | {kind: 'idle'}
    | {kind: 'parsing'}
    | {kind: 'preview'; result: PreviewResult}
    | {kind: 'committing'; result: PreviewResult}
    | {kind: 'imported'; report: {added: number; updated: number}};

export default function ImportPage() {
    const [phase, setPhase] = useState<Phase>({kind: 'idle'});
    const [file, setFile] = useState<File | null>(null);
    const [pending, startTransition] = useTransition();

    function onFile(f: File) {
        setFile(f);
        setPhase({kind: 'parsing'});
        startTransition(async () => {
            const fd = new FormData();
            fd.append('file', f);
            const result = await previewImport(fd);
            setPhase({kind: 'preview', result});
        });
    }

    function onImport() {
        if (!file || phase.kind !== 'preview') return;
        const previewResult = phase.result;
        setPhase({kind: 'committing', result: previewResult});
        startTransition(async () => {
            const fd = new FormData();
            fd.append('file', file);
            const r: CommitResult = await commitImport(fd);
            if (r.kind === 'imported') {
                setPhase({kind: 'imported', report: {added: r.added, updated: r.updated}});
            } else if (r.kind === 'has_errors') {
                setPhase({
                    kind: 'preview',
                    result: {
                        kind: 'ok',
                        total: previewResult.kind === 'ok' ? previewResult.total : 0,
                        previewRows: [],
                        errors: r.errors,
                    },
                });
            } else {
                setPhase({kind: 'preview', result: r});
            }
        });
    }

    function reset() {
        setFile(null);
        setPhase({kind: 'idle'});
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <PageHeader
                title="Импорт CSV"
                kicker="Массовое обновление базы"
                meta="До 5000 строк · UTF-8 или Windows-1251"
            />

            {phase.kind === 'idle' && <ImportDropzone onFile={onFile} />}

            {phase.kind === 'parsing' && (
                <div className="glass glass-strong space-y-4 rounded-[var(--radius-xl)] p-6">
                    <StatusNotice tone="info" title="Готовим превью">
                        Проверяем кодировку, читаем CSV и собираем первые валидные строки.
                    </StatusNotice>
                    <Button variant="primary" size="lg" loading>
                        Парсим файл
                    </Button>
                </div>
            )}

            {phase.kind === 'preview' && phase.result.kind === 'file_error' && (
                <div className="glass glass-strong space-y-4 rounded-[var(--radius-xl)] p-6">
                    <StatusNotice tone="error" title="Файл не удалось прочитать">
                        {phase.result.message}
                    </StatusNotice>
                    <Button variant="primary" size="lg" onClick={reset}>
                        Выбрать другой файл
                    </Button>
                </div>
            )}

            {phase.kind === 'preview' && phase.result.kind === 'ok' && (
                <div className="glass glass-strong space-y-6 rounded-[var(--radius-xl)] p-6">
                    <StatusNotice
                        tone={phase.result.errors.length > 0 ? 'warning' : 'info'}
                        title={phase.result.errors.length > 0 ? 'Исправь ошибки перед импортом' : 'Превью готово'}
                    >
                        Всего строк: {phase.result.total} · Ошибок: {phase.result.errors.length}
                    </StatusNotice>
                    {phase.result.errors.length === 0 && (
                        <ImportPreviewTable rows={phase.result.previewRows} />
                    )}
                    <ImportErrorList errors={phase.result.errors} />
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={onImport}
                            disabled={phase.result.errors.length > 0 || pending}
                            loading={pending}
                        >
                            Импортировать {phase.result.total - phase.result.errors.length} клиентов
                        </Button>
                        <Button variant="secondary" size="lg" onClick={reset}>
                            Отмена
                        </Button>
                    </div>
                </div>
            )}

            {phase.kind === 'committing' && (
                <div className="glass glass-strong space-y-4 rounded-[var(--radius-xl)] p-6">
                    <StatusNotice tone="info" title="Импортируем клиентов">
                        Сохраняем изменения в базе и обновляем списки клиентов и касаний.
                    </StatusNotice>
                    <Button variant="primary" size="lg" loading>
                        Импортируем…
                    </Button>
                </div>
            )}

            {phase.kind === 'imported' && <ImportReport added={phase.report.added} updated={phase.report.updated} />}
        </div>
    );
}
