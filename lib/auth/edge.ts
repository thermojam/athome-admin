import type {NextAuthConfig} from 'next-auth';

export const authEdgeConfig: NextAuthConfig = {
    session: {strategy: 'jwt'},
    pages: {signIn: '/login'},
    providers: [],
    callbacks: {
        authorized({auth, request}) {
            const {pathname} = request.nextUrl;
            const isAuthed = !!auth?.user;

            const isAuthPage =
                pathname === '/login' ||
                pathname === '/register' ||
                pathname.startsWith('/api/auth');

            if (isAuthPage) {
                if (isAuthed && (pathname === '/login' || pathname === '/register')) {
                    return Response.redirect(new URL('/today', request.nextUrl));
                }
                return true;
            }

            return isAuthed;
        },
        async jwt({token, user}) {
            if (user) token.id = (user as { id: string }).id;
            return token;
        },
        async session({session, token}) {
            if (token.id && session.user) {
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        },
    },
};
