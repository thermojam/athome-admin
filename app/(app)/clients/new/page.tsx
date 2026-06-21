import {Card} from '@/components/ui/Card';
import {ClientForm} from '@/components/client/ClientForm';
import {createClient, type ActionResult} from '@/lib/clients/actions';

export default function NewClientPage() {
    async function action(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
        'use server';
        return createClient(formData);
    }

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Новый клиент</h1>
            <Card>
                <ClientForm action={action} submitLabel="Создать"/>
            </Card>
        </>
    );
}
