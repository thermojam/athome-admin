import type {ClientForExport} from './claude';

const ACTIVE_STALE_MEDIUM = {
    kind: 'active_stale' as const,
    priority: 'medium' as const,
    daysSince: 12,
    emoji: '🟠',
};

export type ExportSanityCase = {
    title: string;
    selected: ClientForExport[];
    expectedMissingNames: string[];
    expectedTextHas: string[];
};

export const EXPORT_SANITY_CASES: ExportSanityCase[] = [
    {
        title: 'Один клиент с фактом → строка собирается',
        selected: [{
            id: 'c1',
            name: 'Аня',
            profile: 'health',
            personalFact: 'тренируется к свадьбе сестры',
            goal: 'тонус',
            note: null,
            trigger: ACTIVE_STALE_MEDIUM,
        }],
        expectedMissingNames: [],
        expectedTextHas: ['Аня', 'тренируется к свадьбе сестры', '12д без касания'],
    },
    {
        title: 'Один без факта → text пустой, missing содержит имя',
        selected: [{
            id: 'c2',
            name: 'Боря',
            profile: 'form',
            personalFact: null,
            goal: null,
            note: null,
            trigger: ACTIVE_STALE_MEDIUM,
        }],
        expectedMissingNames: ['Боря'],
        expectedTextHas: [],
    },
    {
        title: 'Один с фактом, один с пробелами → второй в missing, первый собирается',
        selected: [
            {
                id: 'c3', name: 'Вика', profile: 'energy',
                personalFact: 'бегает марафоны', goal: 'выносливость',
                note: 'выходные занята', trigger: ACTIVE_STALE_MEDIUM,
            },
            {
                id: 'c4', name: 'Гена', profile: null,
                personalFact: '   ', goal: null, note: null,
                trigger: ACTIVE_STALE_MEDIUM,
            },
        ],
        expectedMissingNames: ['Гена'],
        expectedTextHas: ['Вика', 'бегает марафоны', 'выходные занята'],
    },
    {
        title: 'Текст содержит шаблон-префикс и разделитель ---',
        selected: [{
            id: 'c5', name: 'Дима', profile: 'health',
            personalFact: 'играет в баскет', goal: 'спина',
            note: null, trigger: ACTIVE_STALE_MEDIUM,
        }],
        expectedMissingNames: [],
        expectedTextHas: ['SANITY_PROMPT', '---', 'Дима'],
    },
    {
        title: 'daysSince=Infinity → отображается как ∞',
        selected: [{
            id: 'c6', name: 'Женя', profile: null,
            personalFact: 'не любит мобайл-формат', goal: null,
            note: null,
            trigger: {kind: 'silent', priority: 'high', daysSince: Number.POSITIVE_INFINITY, emoji: '🔇'},
        }],
        expectedMissingNames: [],
        expectedTextHas: ['Женя', '∞д без касания'],
    },
];

export const SANITY_PROMPT = 'SANITY_PROMPT';
