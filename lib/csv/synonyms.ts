import type {ClientProfile, ClientStatus, ClientSource, TouchType} from '@/lib/db/schema';

export const CANONICAL_HEADERS = [
    'Имя',
    'Контакт',
    'Профиль',
    'Статус',
    'Источник',
    'Личный факт',
    'Цель',
    'Тренировок в неделю',
    'Последняя тренировка',
    'Бронь на сентябрь',
    'Заметка',
    'Последнее касание',
    'Тип касания',
    'Дата создания',
    'Дата удаления',
] as const;

export const HEADER_TO_KEY: Record<typeof CANONICAL_HEADERS[number], string> = {
    'Имя': 'name',
    'Контакт': 'contact',
    'Профиль': 'profile',
    'Статус': 'status',
    'Источник': 'source',
    'Личный факт': 'personalFact',
    'Цель': 'goal',
    'Тренировок в неделю': 'sessionsPerWeek',
    'Последняя тренировка': 'lastSessionDate',
    'Бронь на сентябрь': 'septemberBooking',
    'Заметка': 'note',
    'Последнее касание': 'lastTouchDate',
    'Тип касания': 'lastTouchType',
    'Дата создания': 'createdAt',
    'Дата удаления': 'deletedAt',
};

export const REQUIRED_HEADERS: ReadonlyArray<typeof CANONICAL_HEADERS[number]> = ['Имя', 'Статус'];

export const STATUS_SYNONYMS: Record<string, ClientStatus> = {
    'активный': 'active', 'активная': 'active', 'active': 'active',
    'отпуск': 'vacation', 'в отпуске': 'vacation', 'vacation': 'vacation',
    'остыл': 'cooling', 'остывает': 'cooling', 'cooling': 'cooling',
    'лид': 'lead', 'lead': 'lead',
    'предзапись': 'prebook', 'prebook': 'prebook',
    'ушёл': 'left', 'ушел': 'left', 'left': 'left',
};

export const PROFILE_SYNONYMS: Record<string, ClientProfile> = {
    'здоровье': 'health', '🟢 здоровье': 'health', 'health': 'health',
    'форма': 'form', '💪 форма': 'form', 'form': 'form',
    'энергия': 'energy', '⚡ энергия': 'energy', 'energy': 'energy',
};

export const SOURCE_SYNONYMS: Record<string, ClientSource> = {
    'ресепшн': 'reception', 'ресепшен': 'reception', 'reception': 'reception',
    'лифт 1': 'lift1', 'лифт1': 'lift1', 'lift1': 'lift1',
    'лифт 2': 'lift2', 'лифт2': 'lift2', 'lift2': 'lift2',
    'лифт 3': 'lift3', 'лифт3': 'lift3', 'lift3': 'lift3',
    'лифт 4': 'lift4', 'лифт4': 'lift4', 'lift4': 'lift4',
    'авито': 'avito', 'avito': 'avito',
    'рекомендация': 'referral', 'сарафан': 'referral', 'referral': 'referral',
    'чат': 'chat', 'chat': 'chat',
    'база': 'base', 'base': 'base',
    'другое': 'other', 'other': 'other',
};

export const TOUCH_TYPE_SYNONYMS: Record<string, TouchType> = {
    'сообщение': 'message', 'message': 'message',
    'звонок': 'call', 'call': 'call',
    'тренировка': 'training', 'training': 'training',
    'другое': 'other', 'other': 'other',
};

export const BOOL_TRUE = new Set(['да', 'yes', 'true', '1', 'y', 'д']);
export const BOOL_FALSE = new Set(['нет', 'no', 'false', '0', 'n', 'н', '']);
