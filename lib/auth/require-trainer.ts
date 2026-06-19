import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';

export async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }
    return session.user.id;
}
