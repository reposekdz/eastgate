import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message, branchId, department } = await req.json();

    if (!name || !email || !message || !branchId) {
      return NextResponse.json(
        { success: false, error: "Name, email, message, and branch are required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        branchId,
        department: department || "general",
        status: "pending",
      },
      include: {
        branch: { select: { name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({
      success: true,
      contact,
      message: "Your message has been sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit contact form" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { name: true, location: true } },
      },
    });

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error("Contacts fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contacts" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
