import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth - works with any Gmail or Google Workspace account
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // No domain restriction - allow any Google account
          }),
        ]
      : []),
    // Microsoft OAuth - works with Outlook.com, Microsoft 365, and Azure AD accounts
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID || "common", // "common" allows any Microsoft account
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      // Allow any valid email from configured providers
      if (!user.email) {
        return false
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
