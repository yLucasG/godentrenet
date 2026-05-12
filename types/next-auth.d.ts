import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      storeId: string | null;
      storeName: string | null;
      instanceName: string | null;
    } & DefaultSession["user"];
  }
}
