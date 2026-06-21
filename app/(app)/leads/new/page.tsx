import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {Button} from '@/components/ui/Button';
import {createLead} from '@/lib/clients/actions';
import {CLIENT_SOURCES} from '@/lib/db/schema';
import {SOURCE_LABELS} from '@/lib/clients/labels';

export default function NewLeadPage() {
    async function action(formData: FormData) {
        'use server';
        const result = await createLead(formData);
        if (!result.ok) {
            throw new Error(result.error);
        }
    }

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-2">Новый лид</h1>
            <p className="text-tx-2 text-[13px] mb-6">4 поля. Остальное — потом, из карточки.</p>
            <Card>
                <form action={action} className="flex flex-col gap-4">
                    <Input name="name" label="Имя" required autoFocus/>
                    <Input name="contact" label="Контакт (TG-ник, телефон)"/>
                    <Select name="source" label="Источник" defaultValue="">
                        <option value="">— не выбран —</option>
                        {CLIENT_SOURCES.map((s) => (
                            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                        ))}
                    </Select>
                    <Textarea name="personalFact" label="Личный факт (одна строка — что запомнить)" rows={2}/>
                    <Button type="submit" variant="primary" size="lg" className="mt-2">Создать</Button>
                </form>
            </Card>
        </>
    );
}
