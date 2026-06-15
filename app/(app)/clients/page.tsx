import {redirect} from 'next/navigation';
import Link from 'next/link';
import {auth} from '@/lib/auth/config';
import {listClients} from '@/lib/clients/queries';
import {ClientsList} from '@/components/client/ClientsList';
import {ClientFilters} from '@/components/client/ClientFilters';
import {Button} from '@/components/ui/Button';
import {EmptyState} from '@/components/ui/EmptyState';
import {CLIENT_STATUSES, CLIENT_PROFILES, type ClientStatus, type ClientProfile} from '@/lib/db/schema';

type SP = Promise<{q?: string; status?: string; profile?: string; deleted?: string}>;

function parseList<T extends string>(s: string | undefined, allowed: readonly T[]): T[] {
    if (!s) return [];
    const allowedSet = new Set(allowed);
    return s.split(',').filter((v): v is T => allowedSet.has(v as T));
}

export default async function ClientsPage({searchParams}: {searchParams: SP}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const sp = await searchParams;
    const statuses = parseList<ClientStatus>(sp.status, CLIENT_STATUSES);
    const profiles = parseList<ClientProfile>(sp.profile, CLIENT_PROFILES);

    const clients = await listClients({
        trainerId: session.user.id,
        search: sp.q,
        statuses: statuses.length ? statuses : undefined,
        profiles: profiles.length ? profiles : undefined,
        includeDeleted: sp.deleted === '1',
    });

    const noFilters = !sp.q && statuses.length === 0 && profiles.length === 0 && sp.deleted !== '1';
    const isEmpty = clients.length === 0 && noFilters;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display uppercase text-[27px] tracking-wide">База</h1>
                <Link href="/clients/new">
                    <Button variant="primary" size="md">+ Клиент</Button>
                </Link>
            </div>
            {isEmpty ? (
                <EmptyState
                    title="База пустая"
                    hint="Добавь первого клиента — или быстро заведи лида с любого экрана."
                    action={
                        <Link href="/clients/new">
                            <Button variant="primary" size="md">+ Клиент</Button>
                        </Link>
                    }
                />
            ) : (
                <>
                    <ClientFilters/>
                    <ClientsList clients={clients}/>
                </>
            )}
        </>
    );
}
