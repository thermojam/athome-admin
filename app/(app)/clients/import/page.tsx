'use client';

import {useState, useTransition} from 'react';
import {previewImport, commitImport} from '@/lib/clients/import';
import type {PreviewResult, CommitResult} from '@/lib/clients/import';
import {ImportDropzone} from '@/components/import/ImportDropzone';
import {ImportPreviewTable} from '@/components/import/ImportPreviewTable';
import {ImportErrorList} from '@/components/import/ImportErrorList';
import {ImportReport} from '@/components/import/ImportReport';

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
        <div className="p-6 max-w-3xl space-y-4">
            <h1 className="text-2xl font-semibold">Импорт CSV</h1>

            {phase.kind === 'idle' && <ImportDropzone onFile={onFile} />}

            {phase.kind === 'parsing' && (
                <p className="text-zinc-500">Парсим файл…</p>
            )}

            {phase.kind === 'preview' && phase.result.kind === 'file_error' && (
                <>
                    <div className="border border-rose-300 rounded-lg p-3 bg-rose-50">{phase.result.message}</div>
                    <button onClick={reset} className="px-4 py-2 rounded-md border">Выбрать другой файл</button>
                </>
            )}

            {phase.kind === 'preview' && phase.result.kind === 'ok' && (
                <>
                    <p className="text-zinc-600">Всего строк: {phase.result.total} · Ошибок: {phase.result.errors.length}</p>
                    {phase.result.errors.length === 0 && (
                        <ImportPreviewTable rows={phase.result.previewRows} />
                    )}
                    <ImportErrorList errors={phase.result.errors} />
                    <div className="flex gap-2">
                        <button
                            onClick={onImport}
                            disabled={phase.result.errors.length > 0 || pending}
                            className="px-4 py-2 rounded-md bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Импортировать {phase.result.total - phase.result.errors.length} клиентов
                        </button>
                        <button onClick={reset} className="px-4 py-2 rounded-md border">Отмена</button>
                    </div>
                </>
            )}

            {phase.kind === 'committing' && <p className="text-zinc-500">Импортируем…</p>}

            {phase.kind === 'imported' && <ImportReport added={phase.report.added} updated={phase.report.updated} />}
        </div>
    );
}
