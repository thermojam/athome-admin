import type {CsvRow, RowError} from './validate';

export type ParseExpected =
    | {kind: 'file_error'; messageContains: string}
    | {kind: 'ok'; expectFirstRow?: Partial<CsvRow>; expectErrors?: Partial<RowError>[]; expectRowCount?: number};

export type SanityCase = {
    id: string;
    label: string;
    csv: string;
    expected: ParseExpected;
};

const HEADERS = 'Имя,Контакт,Профиль,Статус,Источник,Личный факт,Цель,Тренировок в неделю,Последняя тренировка,Бронь на сентябрь,Заметка,Последнее касание,Тип касания,Дата создания,Дата удаления';

export const SANITY_CASES: SanityCase[] = [
    {
        id: 'minimum',
        label: '1. Минимум: только Имя и Статус',
        csv: `Имя,Статус\nАнна,активный`,
        expected: {kind: 'ok', expectRowCount: 1, expectFirstRow: {name: 'Анна', status: 'active'}},
    },
    {
        id: 'happy_full',
        label: '2. Полный happy-path — все 15 колонок',
        csv: `${HEADERS}\nИван,@ivan,форма,активный,ресепшн,любит борщ,набрать 5 кг,3,2026-06-10,да,VIP,2026-06-15,звонок,2024-01-01,`,
        expected: {
            kind: 'ok',
            expectRowCount: 1,
            expectFirstRow: {
                name: 'Иван',
                contact: '@ivan',
                profile: 'form',
                status: 'active',
                source: 'reception',
                sessionsPerWeek: 3,
                lastSessionDate: '2026-06-10',
                septemberBooking: true,
                lastTouchDate: '2026-06-15',
                lastTouchType: 'call',
            },
        },
    },
    {
        id: 'date_dotted',
        label: '3. Дата dd.mm.yyyy',
        csv: `Имя,Статус,Последняя тренировка\nОля,активный,15.03.2025`,
        expected: {kind: 'ok', expectFirstRow: {lastSessionDate: '2025-03-15'}},
    },
    {
        id: 'date_excel_serial',
        label: '4. Excel serial 45000 → 2023-03-09',
        csv: `Имя,Статус,Последняя тренировка\nСерж,активный,45000`,
        expected: {kind: 'ok', expectFirstRow: {lastSessionDate: '2023-03-09'}},
    },
    {
        id: 'bool_variants',
        label: '5. Bool: да/1/true/пусто/нет',
        csv: `Имя,Статус,Бронь на сентябрь\nA,активный,да\nB,активный,1\nC,активный,true\nD,активный,\nE,активный,нет`,
        expected: {kind: 'ok', expectRowCount: 5},
    },
    {
        id: 'status_synonym',
        label: '6. «Активный» → active через словарь',
        csv: `Имя,Статус\nЛена,Активный`,
        expected: {kind: 'ok', expectFirstRow: {status: 'active'}},
    },
    {
        id: 'unknown_status',
        label: '7. Неизвестный статус → ошибка строки',
        csv: `Имя,Статус\nПётр,непонятно`,
        expected: {kind: 'ok', expectErrors: [{lineNo: 2, field: 'status'}]},
    },
    {
        id: 'missing_required_header',
        label: '8. Нет колонки «Имя» → file_error',
        csv: `Статус\nактивный`,
        expected: {kind: 'file_error', messageContains: 'Имя'},
    },
    {
        id: 'two_digit_year',
        label: '9. Двузначный год: 15/03/25 → 2025; 15/03/85 → 1985',
        csv: `Имя,Статус,Последняя тренировка\nЮ,активный,15/03/25\nС,активный,15/03/85`,
        expected: {kind: 'ok', expectRowCount: 2},
    },
    {
        id: 'bad_date',
        label: '10. Неверная дата 32.13.2025 → ошибка строки',
        csv: `Имя,Статус,Последняя тренировка\nК,активный,32.13.2025`,
        expected: {kind: 'ok', expectErrors: [{lineNo: 2, field: 'lastSessionDate'}]},
    },
];
