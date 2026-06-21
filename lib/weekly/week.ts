const MONTHS_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Возвращает понедельник ISO-недели в формате YYYY-MM-DD для заданной даты.
// Воскресенье считается частью предыдущей недели.
export function getWeekStart(d: Date): string {
    const day = d.getUTCDay();           // 0=Sun, 1=Mon, ..., 6=Sat
    const offset = day === 0 ? 6 : day - 1;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset));
    return formatIso(monday);
}

// "2026-06-15" -> "15–21 июня"
// Если неделя пересекает месяц: "29 июня – 5 июля"
// Год показывается только если отличается от текущего: "23–29 декабря 2025"
export function formatWeekLabel(weekStart: string, today: Date = new Date()): string {
    const [y, m, d] = weekStart.split('-').map((s) => parseInt(s, 10));
    const start = new Date(Date.UTC(y, m - 1, d));
    const end = new Date(Date.UTC(y, m - 1, d + 6));

    const sameMonth = start.getUTCMonth() === end.getUTCMonth();
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const showYear = start.getUTCFullYear() !== today.getUTCFullYear();

    if (sameMonth && sameYear) {
        const month = MONTHS_GENITIVE[start.getUTCMonth()];
        const base = `${start.getUTCDate()}–${end.getUTCDate()} ${month}`;
        return showYear ? `${base} ${start.getUTCFullYear()}` : base;
    }

    const startMonth = MONTHS_GENITIVE[start.getUTCMonth()];
    const endMonth = MONTHS_GENITIVE[end.getUTCMonth()];
    const base = `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth}`;
    return showYear ? `${base} ${start.getUTCFullYear()}` : base;
}

function formatIso(d: Date): string {
    const y = d.getUTCFullYear().toString().padStart(4, '0');
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
}
