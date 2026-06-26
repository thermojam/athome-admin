export default function AuthLayout({children}: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen px-4 py-10 md:grid md:place-items-center">
            <div className="page-enter mx-auto w-full max-w-[460px]">{children}</div>
        </main>
    );
}
