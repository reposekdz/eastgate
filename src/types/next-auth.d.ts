import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            department?: string;
            branchId: string;
            permissions: string[];
        } & DefaultSession["user"];
    }

    interface User {
        role?: string;
        department?: string;
        branchId?: string;
        permissions?: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        department?: string;
        branchId: string;
        permissions: string[];
    }
}
