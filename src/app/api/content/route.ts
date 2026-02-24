import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch all dynamic content from database
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // hero, features, rooms, menu, services, etc.
    const locale = searchParams.get("locale") || "en";
    const branchId = searchParams.get("branchId");

    let content: any = {};

    // Fetch page content from database
    const pageContents = await prisma.pageContent.findMany({
      where: {
        published: true,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Organize content by slug
    content.pages = pageContents.reduce((acc: any, page: any) => {
      acc[page.slug] = {
        title: page.title,
        subtitle: page.subtitle,
        content: page.content,
        imageUrl: page.imageUrl,
        gallery: page.gallery,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
      };
      return acc;
    }, {});

    // Fetch rooms for dynamic content
    const rooms = await prisma.room.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
      },
      orderBy: [
        { type: "asc" },
        { number: "asc" },
      ],
      take: 20,
    });

    content.rooms = rooms.map(room => ({
      id: room.id,
      number: room.number,
      floor: room.floor,
      type: room.type,
      status: room.status,
      price: room.price,
      description: room.description,
      imageUrl: room.imageUrl,
    }));

    // Fetch menu items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        available: true,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    content.menu = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      imageUrl: item.imageUrl,
      popular: item.popular,
      vegetarian: item.vegetarian,
      spicy: item.spicy,
    }));

    // Fetch services
    const services = await prisma.service.findMany({
      where: {
        available: true,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
    });

    content.services = services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      price: service.price,
      duration: service.duration,
      description: service.description,
      imageUrl: service.imageUrl,
    }));

    // Fetch events
    const events = await prisma.event.findMany({
      where: {
        status: "upcoming",
        ...(branchId ? { branchId } : {}),
      },
      orderBy: {
        date: "asc",
      },
      take: 10,
    });

    content.events = events.map(event => ({
      id: event.id,
      name: event.name,
      type: event.type,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      hall: event.hall,
      capacity: event.capacity,
      description: event.description,
    }));

    // Fetch branches info
    const branches = await prisma.branch.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    content.branches = branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      location: branch.location,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
    }));

    // Fetch testimonials/reviews (from messages)
    const testimonials = await prisma.message.findMany({
      where: {
        read: true,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    content.testimonials = testimonials
      .filter(m => m.sender === "guest")
      .map(t => ({
        id: t.id,
        name: t.senderName,
        message: t.message,
        avatar: t.senderAvatar,
        date: t.createdAt,
      }));

    return NextResponse.json({
      success: true,
      content,
      locale,
    });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// POST - Create/update page content (Admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      title,
      subtitle,
      content,
      imageUrl,
      gallery,
      metaTitle,
      metaDescription,
      published,
      branchId,
    } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "slug and title are required" },
        { status: 400 }
      );
    }

    // Check if content exists
    const existing = await prisma.pageContent.findUnique({
      where: { slug },
    });

    let result;

    if (existing) {
      // Update
      result = await prisma.pageContent.update({
        where: { slug },
        data: {
          title,
          subtitle,
          content,
          imageUrl,
          gallery,
          metaTitle,
          metaDescription,
          published: published !== false,
        },
      });
    } else {
      // Create
      result = await prisma.pageContent.create({
        data: {
          slug,
          title,
          subtitle,
          content,
          imageUrl,
          gallery,
          metaTitle,
          metaDescription,
          published: published !== false,
          branchId: branchId || "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      content: result,
    });
  } catch (error) {
    console.error("Content save error:", error);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}

// PUT - Update specific content
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      slug,
      title,
      subtitle,
      content,
      imageUrl,
      gallery,
      metaTitle,
      metaDescription,
      published,
    } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    const result = await prisma.pageContent.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content !== undefined && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(gallery !== undefined && { gallery }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(published !== undefined && { published }),
      },
    });

    return NextResponse.json({
      success: true,
      content: result,
    });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

// DELETE - Remove page content
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "slug is required" },
        { status: 400 }
      );
    }

    await prisma.pageContent.delete({
      where: { slug },
    });

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Content deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}
