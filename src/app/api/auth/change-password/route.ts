import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Fetch user from DB to verify current password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Verify current password
        const isCurrentPasswordValid = await compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return new NextResponse("Invalid current password", { status: 400 });
        }

        // Hash new password
        const hashedNewPassword = await hash(newPassword, 12);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                mustChangePassword: false,
                lastPasswordChange: new Date(),
            },
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("[CHANGE_PASSWORD]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
