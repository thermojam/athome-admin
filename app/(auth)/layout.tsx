export default function AuthLayout({children}: { children: React.ReactNode }) {
    return (
        <main className="grid min-h-screen place-items-center px-4 py-8">
            <div className="page-enter mx-auto w-full max-w-[460px]">{children}</div>
        </main>
    );
}
