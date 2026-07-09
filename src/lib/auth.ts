import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const isGoogleAuthConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: isGoogleAuthConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : [],
  secret: process.env.AUTH_SECRET ?? "dev-secret-vietmindmap-local-only",
  pages: {
    signIn: "/",
  },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
