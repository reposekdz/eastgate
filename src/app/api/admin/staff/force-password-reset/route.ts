import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || (session.user?.role !== "super_admin" && session.user?.role !== "super_manager" && session.user?.role !== "branch_manager")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return new NextResponse("Missing user ID", { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                mustChangePassword: true,
            },
        });

        return NextResponse.json({ success: true, message: "Forced password reset successful" });
    } catch (error) {
        console.error("[FORCE_PASSWORD_RESET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
