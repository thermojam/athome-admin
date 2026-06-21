import {z} from 'zod';
import {TOUCH_TYPES} from '@/lib/db/schema';

export const TouchCreateSchema = z.object({
    type: z.enum(TOUCH_TYPES),
    note: z
        .string()
        .trim()
        .max(500, 'Слишком длинная заметка')
        .optional()
        .transform((v) => (v && v !== '' ? v : null)),
});

export type TouchCreateInput = z.infer<typeof TouchCreateSchema>;
