import type {Metadata} from 'next';
import {Nunito, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const nunito = Nunito({
    subsets: ['latin', 'cyrillic'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-sans-loaded',
    display: 'swap',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-mono-loaded',
    display: 'swap',
});

// TODO: когда положишь Gerhaus в public/fonts — раскомментируй и убери fallback
// import localFont from 'next/font/local';
// const gerhaus = localFont({
//   src: [{ path: '../public/fonts/gerhaus-regular.woff2', weight: '400', style: 'normal' }],
//   variable: '--font-display-loaded',
//   display: 'swap',
//   fallback: ['Georgia', 'serif'],
// });

export const metadata: Metadata = {
    title: 'Штаб',
    description: 'Админка тренера: база клиентов и пятничный ритуал',
    icons: {
        icon: '/favicon.png',
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" className={`${nunito.variable} ${jetbrains.variable}`}>
        <body>{children}</body>
        </html>
    );
}
