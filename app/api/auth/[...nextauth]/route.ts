import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const handler = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        if (credentials?.email && credentials?.password) {
          return {
            id: "1",
            name: "Admin",
            email: credentials.email,
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      return token;
    },
    async session({ session, token }: any) {
      return session;
    }
  }
});

export { handler as GET, handler as POST };