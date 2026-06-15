import NextAuth from 'next-auth';
import { authEdgeConfig } from '@/lib/auth/edge';

const { auth } = NextAuth(authEdgeConfig);

export default auth;

export const config = {
  // Исключаем /api целиком — API-роуты сами решают про авторизацию;
  // также исключаем статику Next и шрифты.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|fonts/).*)'],
};
