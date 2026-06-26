import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {Button} from '@/components/ui/Button';
import {PageHeader} from '@/components/ui/PageHeader';
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
            <PageHeader
                title="Новый лид"
                kicker="Клиенты и лиды"
                meta="4 поля. Остальное — потом, из карточки."
            />
            <Card variant="strong">
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
