import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { trainers } from '@/lib/db/schema';
import { verifyPassword } from './password';
import { authEdgeConfig } from './edge';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authEdgeConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const [trainer] = await db
          .select()
          .from(trainers)
          .where(eq(trainers.email, parsed.data.email))
          .limit(1);
        if (!trainer) return null;

        const ok = await verifyPassword(parsed.data.password, trainer.passwordHash);
        if (!ok) return null;

        return { id: trainer.id, email: trainer.email, name: trainer.name };
      },
    }),
  ],
});
