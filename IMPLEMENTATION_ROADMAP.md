# EastGate Hotel - Critical Features Implementation Roadmap

## 🎯 IMMEDIATE FIXES (Completed)

### ✅ 1. Staff Deletion - FIXED
- Updated DELETE endpoints to support permanent deletion
- Added `?permanent=true` parameter
- Frontend now removes staff from database
- Activity logging before deletion
- Proper confirmation dialogs

---

## 🔥 HIGH PRIORITY IMPLEMENTATIONS

### 1. Payment Processing Integration

**Stripe Integration:**
```typescript
// /api/payments/stripe/create-intent/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { amount, currency, bookingId } = await req.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: currency || 'usd',
    metadata: { bookingId },
  });
  
  return NextResponse.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
}
```

**Mobile Money Integration:**
```typescript
// /api/payments/mobile-money/route.ts
export async function POST(req: NextRequest) {
  const { phone, amount, provider } = await req.json();
  
  // MTN Mobile Money or Airtel Money API call
  const response = await fetch('https://api.mtn.com/collection/v1_0/requesttopay', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MTN_API_KEY}`,
      'X-Target-Environment': 'production',
    },
    body: JSON.stringify({
      amount,
      currency: 'RWF',
      externalId: generateId(),
      payer: { partyIdType: 'MSISDN', partyId: phone },
    }),
  });
  
  return NextResponse.json({ success: true, transactionId: response.id });
}
```

---

### 2. Check-in/Check-out Workflow

**Check-in API:**
```typescript
// /api/bookings/[id]/check-in/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { room: true, guest: true },
  });
  
  if (!booking) return errorResponse('Booking not found', [], 404);
  if (booking.status !== 'confirmed') return errorResponse('Booking not confirmed', [], 400);
  
  // Update booking and room status
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: params.id },
      data: { status: 'checked_in', checkInTime: new Date() },
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'occupied', currentGuestId: booking.guestId },
    }),
    prisma.activityLog.create({
      data: {
        userId: booking.guestId,
        action: 'check_in',
        entity: 'booking',
        entityId: params.id,
        details: { roomNumber: booking.room.number },
      },
    }),
  ]);
  
  // Send welcome email
  await sendEmail({
    to: booking.guest.email,
    subject: 'Welcome to EastGate Hotel',
    template: 'check-in-confirmation',
    data: { guestName: booking.guest.name, roomNumber: booking.room.number },
  });
  
  return successResponse({ message: 'Check-in successful' });
}
```

**Check-out API:**
```typescript
// /api/bookings/[id]/check-out/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { paymentMethod, additionalCharges } = await req.json();
  
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { room: true, guest: true, orders: true },
  });
  
  if (!booking) return errorResponse('Booking not found', [], 404);
  if (booking.status !== 'checked_in') return errorResponse('Guest not checked in', [], 400);
  
  // Calculate total bill
  const roomCharges = booking.totalAmount;
  const orderCharges = booking.orders.reduce((sum, order) => sum + order.total, 0);
  const totalBill = roomCharges + orderCharges + (additionalCharges || 0);
  
  // Process payment
  const payment = await processPayment({
    amount: totalBill,
    method: paymentMethod,
    bookingId: booking.id,
  });
  
  if (!payment.success) return errorResponse('Payment failed', [], 400);
  
  // Update booking and room
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: params.id },
      data: { 
        status: 'checked_out', 
        checkOutTime: new Date(),
        finalAmount: totalBill,
        paymentStatus: 'paid',
      },
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'cleaning', currentGuestId: null },
    }),
    prisma.assignment.create({
      data: {
        type: 'turnover',
        roomId: booking.roomId,
        branchId: booking.room.branchId,
        priority: 'high',
        status: 'pending',
        description: `Turnover cleaning for Room ${booking.room.number}`,
      },
    }),
  ]);
  
  // Generate invoice
  const invoice = await generateInvoice(booking.id);
  
  // Send thank you email with invoice
  await sendEmail({
    to: booking.guest.email,
    subject: 'Thank you for staying with us',
    template: 'check-out-confirmation',
    data: { guestName: booking.guest.name, invoiceUrl: invoice.url },
  });
  
  return successResponse({ 
    message: 'Check-out successful',
    invoice: invoice.url,
    totalBill,
  });
}
```

---

### 3. Real-time Room Status Updates

**WebSocket Server:**
```typescript
// /lib/websocket.ts
import { Server } from 'socket.io';

export function initializeWebSocket(server: any) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe:rooms', (branchId) => {
      socket.join(`rooms:${branchId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

export function broadcastRoomUpdate(io: any, branchId: string, room: any) {
  io.to(`rooms:${branchId}`).emit('room:updated', room);
}
```

**Room Status Hook:**
```typescript
// /hooks/useRoomStatus.ts
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useRoomStatus(branchId: string) {
  const [rooms, setRooms] = useState([]);
  
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL!);
    
    socket.emit('subscribe:rooms', branchId);
    
    socket.on('room:updated', (room) => {
      setRooms(prev => prev.map(r => r.id === room.id ? room : r));
    });
    
    return () => socket.disconnect();
  }, [branchId]);
  
  return rooms;
}
```

---

### 4. Inventory Tracking with Order Integration

**Order Creation with Inventory Deduction:**
```typescript
// /api/orders/route.ts
export async function POST(req: NextRequest) {
  const { items, tableId, guestId } = await req.json();
  
  // Check inventory availability
  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
      include: { ingredients: true },
    });
    
    for (const ingredient of menuItem.ingredients) {
      const stock = await prisma.inventoryItem.findUnique({
        where: { id: ingredient.inventoryItemId },
      });
      
      if (stock.quantity < ingredient.quantity * item.quantity) {
        return errorResponse(
          `Insufficient stock for ${menuItem.name}`,
          [{ field: 'inventory', message: `Only ${stock.quantity} ${stock.unit} available` }],
          400
        );
      }
    }
  }
  
  // Create order and deduct inventory
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        tableId,
        guestId,
        status: 'pending',
        items: {
          create: items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });
    
    // Deduct inventory
    for (const item of items) {
      const menuItem = await tx.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { ingredients: true },
      });
      
      for (const ingredient of menuItem.ingredients) {
        await tx.inventoryItem.update({
          where: { id: ingredient.inventoryItemId },
          data: {
            quantity: { decrement: ingredient.quantity * item.quantity },
          },
        });
        
        // Log inventory movement
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: ingredient.inventoryItemId,
            type: 'usage',
            quantity: -(ingredient.quantity * item.quantity),
            orderId: newOrder.id,
            notes: `Used for order #${newOrder.id}`,
          },
        });
      }
    }
    
    return newOrder;
  });
  
  // Check for low stock and send alerts
  await checkLowStockAlerts();
  
  return successResponse({ order });
}
```

**Low Stock Alerts:**
```typescript
// /api/inventory/check-low-stock/route.ts
export async function GET(req: NextRequest) {
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      quantity: { lte: prisma.inventoryItem.fields.reorderLevel },
    },
  });
  
  if (lowStockItems.length > 0) {
    // Send notification to stock manager
    await prisma.notification.createMany({
      data: lowStockItems.map(item => ({
        userId: 'stock-manager-id',
        type: 'low_stock',
        title: `Low Stock Alert: ${item.name}`,
        message: `Only ${item.quantity} ${item.unit} remaining. Reorder level: ${item.reorderLevel}`,
        priority: 'high',
      })),
    });
  }
  
  return successResponse({ lowStockItems });
}
```

---

### 5. Email Notification System

**Email Service Setup:**
```typescript
// /lib/email.ts
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT!),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: string;
  data: any;
}) {
  const EmailTemplate = await import(`@/emails/${template}`);
  const html = render(<EmailTemplate.default {...data} />);
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
```

**Booking Confirmation Email:**
```typescript
// /emails/booking-confirmation.tsx
export default function BookingConfirmation({ 
  guestName, 
  roomType, 
  checkIn, 
  checkOut, 
  totalAmount 
}: any) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Booking Confirmation</Heading>
          <Text>Dear {guestName},</Text>
          <Text>Your booking at EastGate Hotel has been confirmed!</Text>
          <Section>
            <Row>
              <Column>Room Type:</Column>
              <Column>{roomType}</Column>
            </Row>
            <Row>
              <Column>Check-in:</Column>
              <Column>{checkIn}</Column>
            </Row>
            <Row>
              <Column>Check-out:</Column>
              <Column>{checkOut}</Column>
            </Row>
            <Row>
              <Column>Total Amount:</Column>
              <Column>${totalAmount}</Column>
            </Row>
          </Section>
          <Button href="https://eastgatehotel.rw/bookings">View Booking</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## 📦 REQUIRED PACKAGES

```bash
# Payment
npm install stripe @flutterwave/node-sdk

# Email
npm install nodemailer @react-email/render @react-email/components

# WebSocket
npm install socket.io socket.io-client

# PDF Generation
npm install jspdf html2canvas

# SMS
npm install twilio africastalking

# Utilities
npm install date-fns lodash
```

---

## 🔧 ENVIRONMENT VARIABLES

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Mobile Money
MTN_API_KEY=...
AIRTEL_API_KEY=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=noreply@eastgatehotel.rw
SMTP_PASS=...
SMTP_FROM="EastGate Hotel <noreply@eastgatehotel.rw>"

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up Stripe account
- [ ] Configure email service
- [ ] Set up SMS service
- [ ] Configure WebSocket server
- [ ] Set up SSL certificates
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup system
- [ ] Set up CI/CD pipeline
- [ ] Load testing
- [ ] Security audit

---

**Status:** Roadmap created, ready for implementation
**Priority:** Start with Payment Integration and Check-in/Check-out
