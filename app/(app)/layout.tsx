import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {Sidebar} from '@/components/nav/Sidebar';
import {MobileTabBar} from '@/components/nav/MobileTabBar';

export default async function AppLayout({children}: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="min-h-screen flex">
            <Sidebar/>
            <main className="flex-1 pb-24 md:pb-0">
                <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-6 md:py-10">
                    {children}
                </div>
            </main>
            <MobileTabBar/>
        </div>
    );
}
