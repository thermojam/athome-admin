import type {ClientProfile, ClientStatus, ClientSource} from '@/lib/db/schema';

export const PROFILE_LABELS: Record<ClientProfile, string> = {
    health: 'Здоровье',
    form: 'Форма',
    energy: 'Энергия',
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
    active: 'Активный',
    vacation: 'Отпуск',
    cooling: 'Остыл',
    lead: 'Лид',
    prebook: 'Предзапись',
    left: 'Ушёл',
};

export const SOURCE_LABELS: Record<ClientSource, string> = {
    reception: 'Ресепшн',
    lift1: 'Лифт ЖК-1',
    lift2: 'Лифт ЖК-2',
    lift3: 'Лифт ЖК-3',
    lift4: 'Лифт ЖК-4',
    avito: 'Авито',
    referral: 'Рефералка',
    chat: 'Чат ЖК',
    base: 'База',
    other: 'Другое',
};

export function profileLabel(p: ClientProfile | null | undefined): string {
    return p ? PROFILE_LABELS[p] : '—';
}

export function statusLabel(s: ClientStatus): string {
    return STATUS_LABELS[s];
}

export function sourceLabel(s: ClientSource | null | undefined): string {
    return s ? SOURCE_LABELS[s] : '—';
}
