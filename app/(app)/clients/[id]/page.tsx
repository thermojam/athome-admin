import {notFound, redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {getClient} from '@/lib/clients/queries';
import {listTouchesForClient} from '@/lib/touches/queries';
import {updateClient, softDeleteClient, type ActionResult} from '@/lib/clients/actions';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {ClientForm} from '@/components/client/ClientForm';
import {TouchActions} from '@/components/touch/TouchActions';
import {TouchHistory} from '@/components/touch/TouchHistory';
import {PageHeader} from '@/components/ui/PageHeader';
import {StatusNotice} from '@/components/ui/StatusNotice';
import {profileLabel, statusLabel, sourceLabel} from '@/lib/clients/labels';

export default async function ClientPage({params}: {params: Promise<{id: string}>}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const {id} = await params;
    const client = await getClient(session.user.id, id);
    if (!client) notFound();

    const touches = client.deletedAt ? [] : await listTouchesForClient(session.user.id, id);

    async function update(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
        'use server';
        return updateClient(id, formData);
    }

    async function remove() {
        'use server';
        await softDeleteClient(id);
    }

    return (
        <>
            <PageHeader
                title={client.name}
                kicker="Клиенты и лиды"
                meta={`${statusLabel(client.status)} · ${profileLabel(client.profile)} · ${sourceLabel(client.source)}`}
                action={!client.deletedAt ? <TouchActions clientId={client.id}/> : undefined}
            />
            {!client.personalFact && (
                <StatusNotice tone="warning" title="Нужен личный факт" className="mb-4">
                    Без личного факта сообщение не соберётся. Допиши — и клиент попадёт в экспорт.
                </StatusNotice>
            )}
            {client.deletedAt && (
                <StatusNotice tone="info" title="Клиент удалён" className="mb-4">
                    Редактирование сохранит правки, но клиент не появится в списке без восстановления.
                </StatusNotice>
            )}
            <Card variant="strong" className="mb-8">
                <ClientForm action={update} initial={client} submitLabel="Сохранить" submitVariant="secondary"/>
            </Card>

            {!client.deletedAt && (
                <section className="mb-8">
                    <h2 className="font-display uppercase text-[15px] tracking-wide text-tx-2 mb-3">История касаний</h2>
                    <TouchHistory touches={touches}/>
                </section>
            )}

            {!client.deletedAt && (
                <form action={remove}>
                    <Button type="submit" variant="ghost" size="sm">
                        Удалить (soft)
                    </Button>
                </form>
            )}
        </>
    );
}
