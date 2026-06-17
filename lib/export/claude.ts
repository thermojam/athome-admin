import type {ClientProfile} from '@/lib/db/schema';
import type {Trigger} from '@/lib/triggers/compute';
import {TRIGGER_LABELS} from '@/lib/triggers/compute';
import {profileLabel} from '@/lib/clients/labels';

// Инвариант безопасности: тип НЕ содержит поле contact.
// Любая утечка контакта в Claude — это баг типа.
export type ClientForExport = {
    id: string;
    name: string;
    profile: ClientProfile | null;
    personalFact: string | null;
    goal: string | null;
    note: string | null;
    trigger: Trigger;
};

export type BuildClaudeExportResult = {
    text: string;
    missing: {id: string; name: string}[];
};

export function buildClaudeExport(
    selected: ClientForExport[],
    promptTemplate: string,
): BuildClaudeExportResult {
    const withFact: ClientForExport[] = [];
    const missing: {id: string; name: string}[] = [];

    for (const c of selected) {
        if (c.personalFact && c.personalFact.trim() !== '') {
            withFact.push(c);
        } else {
            missing.push({id: c.id, name: c.name});
        }
    }

    if (withFact.length === 0) {
        return {text: '', missing};
    }

    const lines = withFact.map((c) => [
        c.name,
        profileLabel(c.profile),
        TRIGGER_LABELS[c.trigger.kind],
        `${Number.isFinite(c.trigger.daysSince) ? c.trigger.daysSince : '∞'}д без касания`,
        c.goal ?? '—',
        c.personalFact,
        c.note ?? '—',
    ].join(' · '));

    return {text: `${promptTemplate}\n\n---\n\n${lines.join('\n')}`, missing};
}
