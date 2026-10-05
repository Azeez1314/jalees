import { auth } from "@/lib/auth/server";

// Pages under /learn require a session; unauthenticated visitors are sent to sign-in.
// API routes check the session themselves and return 401 (a redirect is the wrong answer for fetch()).
export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: ["/learn/:path*"],
};
