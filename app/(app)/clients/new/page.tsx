import {Card} from '@/components/ui/Card';
import {ClientForm} from '@/components/client/ClientForm';
import {PageHeader} from '@/components/ui/PageHeader';
import {createClient, type ActionResult} from '@/lib/clients/actions';

export default function NewClientPage() {
    async function action(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
        'use server';
        return createClient(formData);
    }

    return (
        <>
            <PageHeader
                title="Новый клиент"
                kicker="Клиенты и лиды"
                meta="Добавь в базу вручную"
            />
            <Card variant="strong">
                <ClientForm action={action} submitLabel="Создать"/>
            </Card>
        </>
    );
}
