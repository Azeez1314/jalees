import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

/** The signed-in user, or null. Use in server components, server actions and route handlers. */
export async function getUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}
