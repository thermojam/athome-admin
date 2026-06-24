import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {Sidebar} from '@/components/nav/Sidebar';
import {MobileTabBar} from '@/components/nav/MobileTabBar';
import {TopBar} from '@/components/nav/TopBar';
import {MobileFab} from '@/components/nav/MobileFab';
import {MobileTopBar} from '@/components/nav/MobileTopBar';

export default async function AppLayout({children}: {children: React.ReactNode}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="min-h-screen">
            <Sidebar/>
            <main className="min-h-screen pb-28 pt-24 md:ml-[280px] md:pb-0 md:pt-0">
                <TopBar/>
                <div className="page-enter mx-auto w-full max-w-[1080px] px-4 py-6 md:px-8 md:py-12">
                    {children}
                </div>
            </main>
            <MobileTopBar/>
            <MobileTabBar/>
            <MobileFab/>
        </div>
    );
}
