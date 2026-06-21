import type {TouchType} from '@/lib/db/schema';

export const TOUCH_TYPE_LABELS: Record<TouchType, string> = {
    message: '💬 Сообщение',
    call: '📞 Звонок',
    training: '🏋️ Тренировка',
    other: '✦ Другое',
};

export function touchTypeLabel(t: TouchType): string {
    return TOUCH_TYPE_LABELS[t];
}
