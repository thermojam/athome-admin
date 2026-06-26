import Link from 'next/link';
import {LogOut} from 'lucide-react';
import {BrandLogo} from '@/components/brand/BrandLogo';
import {Button} from '@/components/ui/Button';
import {signOut} from '@/lib/auth/config';
import {MobileTopBarTitle} from './MobileTopBarTitle';

export function MobileTopBar() {
    async function logout() {
        'use server';
        await signOut({redirectTo: '/login'});
    }

    return (
        <header className="fixed inset-x-3 top-3 z-40 flex h-16 items-center gap-3 px-4 md:hidden glass">
            <Link href="/today" aria-label="Открыть Сегодня">
                <BrandLogo size={42}/>
            </Link>
            <MobileTopBarTitle/>
            <form action={logout} className="ml-auto shrink-0">
                <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    aria-label="Выйти"
                    className="h-10 w-10 px-0 text-tx-2"
                >
                    <LogOut size={18} aria-hidden="true"/>
                </Button>
            </form>
        </header>
    );
}
