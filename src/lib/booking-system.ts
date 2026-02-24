/**
 * Advanced Booking System
 * Availability checking, conflict detection, cancellation policies, and management
 */

import prisma from "@/lib/prisma";

// ============================================
// BOOKING CONSTANTS
// ============================================

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CHECKED_IN = "checked_in",
  CHECKED_OUT = "checked_out",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum CancellationPolicy {
  FREE = "free", // 0% charge
  MODERATE = "moderate", // 50% charge
  STRICT = "strict", // Non-refundable
  NON_REFUNDABLE = "non_refundable", // 100% charge
}

// ============================================
// BOOKING INTERFACES
// ============================================

export interface BookingRequest {
  guestId: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  specialRequests?: string;
  cancellationPolicy?: CancellationPolicy;
  branchId: string;
}

export interface AvailabilityResponse {
  roomId: string;
  available: boolean;
  conflicts?: Array<{
    bookingId: string;
    checkInDate: Date;
    checkOutDate: Date;
  }>;
  pricing?: {
    roomPrice: number;
    totalNights: number;
    subtotal: number;
    taxes: number;
    total: number;
  };
}

// ============================================
// AVAILABILITY CHECKING
// ============================================

/**
 * Check room availability
 */
export async function checkRoomAvailability(
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
  excludeBookingId?: string
): Promise<AvailabilityResponse> {
  try {
    // Validate dates
    if (checkInDate >= checkOutDate) {
      throw new Error("Check-in date must be before check-out date");
    }

    if (checkInDate < new Date()) {
      throw new Error("Cannot book for past dates");
    }

    // Find conflicting bookings
    const conflicts = await prisma.booking.findMany({
      where: {
        roomId,
        status: {
          notIn: [BookingStatus.CANCELLED],
        },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        AND: [
          { checkInDate: { lt: checkOutDate } },
          { checkOutDate: { gt: checkInDate } },
        ],
      },
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
      },
    });

    if (conflicts.length > 0) {
      return {
        roomId,
        available: false,
        conflicts,
      };
    }

    // Calculate pricing
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error("Room not found");
    }

    const pricing = calculatePricing(
      room.price,
      checkInDate,
      checkOutDate
    );

    return {
      roomId,
      available: true,
      pricing,
    };
  } catch (error) {
    console.error("Availability check error:", error);
    throw error;
  }
}

/**
 * Check multiple rooms availability
 */
export async function checkMultipleRoomsAvailability(
  roomIds: string[],
  checkInDate: Date,
  checkOutDate: Date
): Promise<AvailabilityResponse[]> {
  return Promise.all(
    roomIds.map((roomId) =>
      checkRoomAvailability(roomId, checkInDate, checkOutDate)
    )
  );
}

/**
 * Get availabile rooms for date range
 */
export async function getAvailableRooms(
  branchId: string,
  checkInDate: Date,
  checkOutDate: Date,
  filters?: {
    roomType?: string;
    minPrice?: number;
    maxPrice?: number;
    occupancy?: number;
  }
): Promise<any[]> {
  try {
    // Get all rooms for branch
    const rooms = await prisma.room.findMany({
      where: {
        branchId,
        status: "available",
        ...(filters?.roomType && { type: filters.roomType }),
        ...(filters?.minPrice && { price: { gte: filters.minPrice } }),
        ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
        ...(filters?.occupancy && {
          maxOccupancy: { gte: filters.occupancy },
        }),
      },
    });

    // Check availability for each room
    const availabilityChecks = await Promise.all(
      rooms.map((room) =>
        checkRoomAvailability(room.id, checkInDate, checkOutDate)
      )
    );

    // Filter and map results
    return availabilityChecks
      .filter((check) => check.available)
      .map((check, index) => ({
        ...rooms[index],
        pricing: check.pricing,
      }));
  } catch (error) {
    console.error("Available rooms check error:", error);
    throw error;
  }
}

// ============================================
// BOOKING CREATION & MANAGEMENT
// ============================================

/**
 * Create booking
 */
export async function createBooking(request: BookingRequest): Promise<any> {
  try {
    // Check availability
    const availability = await checkRoomAvailability(
      request.roomId,
      request.checkInDate,
      request.checkOutDate
    );

    if (!availability.available) {
      throw new Error("Room is not available for selected dates");
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        guestId: request.guestId,
        roomId: request.roomId,
        checkInDate: request.checkInDate,
        checkOutDate: request.checkOutDate,
        numberOfGuests: request.numberOfGuests,
        specialRequests: request.specialRequests,
        status: BookingStatus.PENDING,
        cancellationPolicy: request.cancellationPolicy || CancellationPolicy.MODERATE,
        branchId: request.branchId,
        totalAmount: availability.pricing?.total || 0,
        paidAmount: 0,
      },
    });

    // Send confirmation email
    await sendBookingConfirmationEmail(booking);

    return booking;
  } catch (error) {
    console.error("Booking creation error:", error);
    throw error;
  }
}

/**
 * Update booking
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<BookingRequest>
): Promise<any> {
  try {
    // If dates are being updated, check availability
    if (updates.checkInDate && updates.checkOutDate) {
      const availability = await checkRoomAvailability(
        updates.roomId || "",
        updates.checkInDate,
        updates.checkOutDate,
        bookingId
      );

      if (!availability.available) {
        throw new Error("Selected dates are no longer available");
      }
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: updates,
    });

    return booking;
  } catch (error) {
    console.error("Booking update error:", error);
    throw error;
  }
}

/**
 * Cancel booking with refund calculation
 */
export async function cancelBooking(
  bookingId: string,
  reason: string
): Promise<any> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Calculate refund based on cancellation policy
    const refundAmount = calculateRefund(booking);

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationDate: new Date(),
        cancellationReason: reason,
        refundAmount,
      },
    });

    // Send cancellation email
    await sendCancellationEmail(updatedBooking, refundAmount);

    return updatedBooking;
  } catch (error) {
    console.error("Booking cancellation error:", error);
    throw error;
  }
}

/**
 * Check in guest
 */
export async function checkInGuest(
  bookingId: string,
  roomKeysIssued?: number
): Promise<any> {
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECKED_IN,
        actualCheckInDate: new Date(),
        roomKeysIssued: roomKeysIssued || 1,
      },
    });

    return booking;
  } catch (error) {
    console.error("Check-in error:", error);
    throw error;
  }
}

/**
 * Check out guest
 */
export async function checkOutGuest(
  bookingId: string,
  damages?: number,
  notes?: string
): Promise<any> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Calculate final amount with damages
    let finalAmount = booking.totalAmount;
    if (damages && damages > 0) {
      finalAmount += damages;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CHECKED_OUT,
        actualCheckOutDate: new Date(),
        damages,
        checkoutNotes: notes,
      },
    });

    // Send checkout receipt
    await sendCheckoutReceipt(updatedBooking, finalAmount);

    return updatedBooking;
  } catch (error) {
    console.error("Check-out error:", error);
    throw error;
  }
}

// ============================================
// PRICING CALCULATIONS
// ============================================

/**
 * Calculate pricing for booking
 */
function calculatePricing(
  basePrice: number,
  checkInDate: Date,
  checkOutDate: Date,
  taxRate: number = 0.18
): {
  roomPrice: number;
  totalNights: number;
  subtotal: number;
  taxes: number;
  total: number;
} {
  const totalNights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Apply weekend pricing if applicable
  let adjustedPrice = basePrice;
  const dayCount = getDayTypeCount(checkInDate, checkOutDate);

  if (dayCount.weekendDays > 0) {
    adjustedPrice = basePrice * 1.2; // 20% weekend surcharge
  }

  const subtotal = adjustedPrice * totalNights;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  return {
    roomPrice: adjustedPrice,
    totalNights,
    subtotal,
    taxes,
    total,
  };
}

/**
 * Calculate refund based on cancellation policy
 */
function calculateRefund(booking: any): number {
  const now = new Date();
  const checkInDate = new Date(booking.checkInDate);
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (booking.cancellationPolicy) {
    case CancellationPolicy.FREE:
      return booking.paidAmount; // Full refund

    case CancellationPolicy.MODERATE:
      if (daysUntilCheckIn <= 7) {
        return booking.paidAmount * 0.5; // 50% refund
      }
      return booking.paidAmount; // Full refund

    case CancellationPolicy.STRICT:
      if (daysUntilCheckIn <= 3) {
        return 0; // No refund
      }
      return booking.paidAmount * 0.5; // 50% refund

    case CancellationPolicy.NON_REFUNDABLE:
      return 0; // No refund

    default:
      return booking.paidAmount;
  }
}

/**
 * Count weekend and weekday days
 */
function getDayTypeCount(startDate: Date, endDate: Date): {
  weekendDays: number;
  weekdayDays: number;
} {
  let weekendDays = 0;
  let weekdayDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendDays++;
    } else {
      weekdayDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { weekendDays, weekdayDays };
}

// ============================================
// NOTIFICATIONS & COMMUNICATIONS
// ============================================

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(booking: any): Promise<void> {
  // TODO: Implement with nodemailer
  console.log("Sending booking confirmation email:", booking.id);
}

/**
 * Send cancellation email
 */
export async function sendCancellationEmail(
  booking: any,
  refundAmount: number
): Promise<void> {
  // TODO: Implement with nodemailer
  console.log(
    `Sending cancellation email for booking ${booking.id} with refund ${refundAmount}`
  );
}

/**
 * Send checkout receipt
 */
export async function sendCheckoutReceipt(
  booking: any,
  finalAmount: number
): Promise<void> {
  // TODO: Implement with nodemailer
  console.log(`Sending checkout receipt for booking ${booking.id}`);
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

/**
 * Get booking statistics
 */
export async function getBookingStatistics(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  avgOccupancyRate: number;
}> {
  // TODO: Implement full statistics calculation
  return {
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    avgOccupancyRate: 0,
  };
}

/**
 * Get room occupancy rate
 */
export async function getRoomOccupancyRate(
  roomId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // TODO: Implement occupancy calculation
  return 0;
}
