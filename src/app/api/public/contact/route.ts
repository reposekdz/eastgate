import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch contact submissions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let query = "SELECT * FROM contacts WHERE 1=1";
    const params: any[] = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const contacts = await prisma.$queryRawUnsafe(query, ...params) as any[];

    return NextResponse.json({
      success: true,
      contacts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get contacts error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch contacts",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// POST - Submit a new contact form
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      phone,
      subject,
      message,
      department,
      branchId = "br-001"
    } = body;

    if (!name || !email || !message) {
      return NextResponse.json({
        success: false,
        error: "Name, email, and message are required",
      }, { status: 400 });
    }

    // Get client IP and user agent for spam prevention
    const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Insert the new contact submission
    const contactId = `CNT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await prisma.$executeRaw`
      INSERT INTO contacts (id, name, email, phone, subject, message, department, status, ip_address, user_agent, branch_id, created_at, updated_at)
      VALUES (
        ${contactId},
        ${name},
        ${email},
        ${phone || null},
        ${subject || null},
        ${message},
        ${department || 'general'},
        'pending',
        ${ipAddress},
        ${userAgent},
        ${branchId},
        NOW(),
        NOW()
      )
    `;

    // Also create a notification for the staff
    await prisma.$executeRaw`
      INSERT INTO notifications (id, title, message, type, read, branch_id, created_at)
      VALUES (
        ${`NOTIF-${Date.now()}`},
        'New Contact Form Submission',
        ${`New inquiry from ${name} (${email}): ${subject || 'No subject'}`},
        'contact',
        0,
        ${branchId},
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      contactId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Submit contact error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to submit contact form",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}

// PUT - Update contact status (for staff)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactId, status } = body;

    if (!contactId || !status) {
      return NextResponse.json({
        success: false,
        error: "Contact ID and status are required",
      }, { status: 400 });
    }

    await prisma.$executeRaw`
      UPDATE contacts 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${contactId}
    `;

    return NextResponse.json({
      success: true,
      message: "Contact status updated",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Update contact error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update contact",
      message: process.env.NODE_ENV === "development" ? error.message : "Database error",
    }, { status: 500 });
  }
}
