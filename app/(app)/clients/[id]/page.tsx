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
            <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-display uppercase text-[27px] tracking-wide">{client.name}</h1>
                {!client.deletedAt && <TouchActions clientId={client.id}/>}
            </div>
            <p className="text-tx-2 text-[13px] font-mono mb-6">
                {statusLabel(client.status)} · {profileLabel(client.profile)} · {sourceLabel(client.source)}
            </p>
            {!client.personalFact && (
                <div className="mb-4 px-4 py-3 rounded-[var(--radius-sm)] border border-orange/40 bg-orange/5 text-[13px] text-orange">
                    Без личного факта сообщение не соберётся. Допиши — и клиент попадёт в экспорт.
                </div>
            )}
            {client.deletedAt && (
                <div className="mb-4 px-4 py-3 rounded-[var(--radius-sm)] border border-line bg-bg-3 text-[13px] text-tx-2">
                    Клиент удалён {client.deletedAt.toISOString().slice(0, 10)}. Редактирование сохраняет правки, но клиент не появится в списке без отдельного восстановления.
                </div>
            )}
            <Card className="mb-8">
                <ClientForm action={update} initial={client} submitLabel="Сохранить"/>
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
