import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { isSuperAdminOrManager } from "@/lib/auth";

// Default images for different sections
const DEFAULT_IMAGES = {
  hero: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920",
  about: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920",
  rooms: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1920",
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920",
  events: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920",
  gallery: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920",
  contact: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920",
};

// GET - Fetch all website content
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section"); // hero, about, rooms, restaurant, etc.
    const branchId = searchParams.get("branchId");

    // If section specified, return only that section
    if (section) {
      const content = await prisma.pageContent.findFirst({
        where: {
          slug: section,
          ...(branchId ? { branchId } : {}),
        },
      });

      if (content) {
        return NextResponse.json({
          success: true,
          content: {
            ...content,
            images: content.gallery || DEFAULT_IMAGES[section as keyof typeof DEFAULT_IMAGES],
          },
        });
      }

      // Return default content if not found
      return NextResponse.json({
        success: true,
        content: {
          slug: section,
          title: getDefaultTitle(section),
          subtitle: getDefaultSubtitle(section),
          content: getDefaultContent(section),
          imageUrl: DEFAULT_IMAGES[section as keyof typeof DEFAULT_IMAGES] || DEFAULT_IMAGES.hero,
          gallery: DEFAULT_IMAGES[section as keyof typeof DEFAULT_IMAGES] || DEFAULT_IMAGES.hero,
          isDefault: true,
        },
      });
    }

    // Return all sections
    const sections = ["hero", "about", "rooms", "restaurant", "spa", "events", "gallery", "contact"];
    const allContent: any = {};

    for (const sec of sections) {
      const content = await prisma.pageContent.findFirst({
        where: {
          slug: sec,
          ...(branchId ? { branchId } : {}),
        },
      });

      if (content) {
        allContent[sec] = {
          ...content,
          images: content.gallery || DEFAULT_IMAGES[sec as keyof typeof DEFAULT_IMAGES],
        };
      } else {
        allContent[sec] = {
          slug: sec,
          title: getDefaultTitle(sec),
          subtitle: getDefaultSubtitle(sec),
          content: getDefaultContent(sec),
          imageUrl: DEFAULT_IMAGES[sec as keyof typeof DEFAULT_IMAGES] || DEFAULT_IMAGES.hero,
          isDefault: true,
        };
      }
    }

    return NextResponse.json({
      success: true,
      content: allContent,
    });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// POST - Update content (Super Admin/Manager only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      section,
      title,
      subtitle,
      content,
      imageUrl,
      gallery,
      metaTitle,
      metaDescription,
      branchId,
    } = body;

    if (!section) {
      return NextResponse.json(
        { error: "section is required" },
        { status: 400 }
      );
    }

    // Check if content exists
    const existing = await prisma.pageContent.findFirst({
      where: {
        slug: section,
        ...(branchId ? { branchId } : {}),
      },
    });

    let result;

    if (existing) {
      // Update existing
      result = await prisma.pageContent.update({
        where: { id: existing.id },
        data: {
          title: title || existing.title,
          subtitle: subtitle || existing.subtitle,
          content: content || existing.content,
          imageUrl: imageUrl || existing.imageUrl,
          gallery: gallery || existing.gallery,
          metaTitle: metaTitle || existing.metaTitle,
          metaDescription: metaDescription || existing.metaDescription,
          published: true,
        },
      });
    } else {
      // Create new
      result = await prisma.pageContent.create({
        data: {
          slug: section,
          title: title || getDefaultTitle(section),
          subtitle: subtitle || "",
          content: content || "",
          imageUrl: imageUrl || DEFAULT_IMAGES[section as keyof typeof DEFAULT_IMAGES] || "",
          gallery: gallery || [],
          metaTitle: metaTitle || title || getDefaultTitle(section),
          metaDescription: metaDescription || "",
          published: true,
          branchId: branchId || "",
        },
      });
    }

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.email || undefined,
        branchId: session.user.branchId || "",
        action: "content_updated",
        entity: "page_content",
        entityId: result.id,
        details: { section, title },
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

// PUT - Update single field
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as string;

    if (!isSuperAdminOrManager(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { section, field, value, branchId } = body;

    if (!section || !field) {
      return NextResponse.json(
        { error: "section and field are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.pageContent.findFirst({
      where: {
        slug: section,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    updateData[field] = value;

    const result = await prisma.pageContent.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      content: result,
    });
  } catch (error) {
    console.error("Content field update error:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

// Helper functions for default content
function getDefaultTitle(section: string): string {
  const titles: Record<string, Record<string, string>> = {
    hero: {
      en: "Welcome to EastGate Hotel",
      rw: "Murakaze muri EastGate Hotel",
      fr: "Bienvenue à EastGate Hotel",
    },
    about: {
      en: "About EastGate",
      rw: "Ibyerekeye EastGate",
      fr: "À propos d'EastGate",
    },
    rooms: {
      en: "Our Rooms",
      rw: "Ibyumba Byacu",
      fr: "Nos Chambres",
    },
    restaurant: {
      en: "Dining",
      rw: "Ibiryo",
      fr: "Restauration",
    },
    spa: {
      en: "Spa & Wellness",
      rw: "Spa n'Umwero",
      fr: "Spa & Bien-être",
    },
    events: {
      en: "Events & Conferences",
      rw: "Ibirori n'Inama",
      fr: "Événements",
    },
    gallery: {
      en: "Gallery",
      rw: "Amafoto",
      fr: "Galerie",
    },
    contact: {
      en: "Contact Us",
      rw: "Twandikire",
      fr: "Contactez-nous",
    },
  };

  return titles[section]?.en || section;
}

function getDefaultSubtitle(section: string): string {
  const subtitles: Record<string, Record<string, string>> = {
    hero: {
      en: "Luxury in the Heart of Africa",
      rw: "Ubwiza mu Mutima wa Afurika",
      fr: "Luxe au Cœur de l'Afrique",
    },
    about: {
      en: "Experience unparalleled luxury",
      rw: "Shakira ubwiza budasanzwe",
      fr: "Vivez un luxe inégalé",
    },
  };

  return subtitles[section]?.en || "";
}

function getDefaultContent(section: string): string {
  const contents: Record<string, Record<string, string>> = {
    hero: {
      en: "Discover the perfect blend of luxury and African hospitality at EastGate Hotel. Your journey to excellence begins here.",
      rw: "Sobanukirwa ubwiza n'ubuhamya bw'Afurika muri EastGate Hotel. Inzira yawe igana kububonera ibikurikira.",
      fr: "Découvrez le mélange parfait de luxe et d'hospitalité africaine à EastGate Hotel.",
    },
    about: {
      en: "EastGate Hotel is a premier hospitality destination in Rwanda, offering world-class accommodation, dining, and wellness services. Our commitment to excellence ensures memorable experiences for every guest.",
      rw: "EastGate Hotel ni ahantu hatangira ibikorwa mu Rwanda, hatanga ibikoresho byiza, ibiryo, n'ibikorwa by'umwero. Icommitment yacu kugira nibwo babona ibintu bikomeye.",
      fr: "EastGate Hotel est une destination d'hospitalité de premier ordre au Rwanda.",
    },
  };

  return contents[section]?.en || "";
}
