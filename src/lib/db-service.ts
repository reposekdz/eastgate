import { prisma } from './prisma';
import { OrderType, PaymentProvider, PaymentStatus, TransactionStatus, RevenueStatus } from '@prisma/client';

export async function createCustomer(data: {
  email: string;
  name: string;
  phone: string;
}) {
  return await prisma.customer.upsert({
    where: { email: data.email },
    update: { name: data.name, phone: data.phone },
    create: data,
  });
}

export async function createOrder(data: {
  orderId: string;
  type: string;
  amount: number;
  currency: string;
  customerId: string;
  branchId: string;
  items: Array<{ itemId: string; name: string; quantity: number; price: number }>;
  metadata?: any;
}) {
  return await prisma.order.create({
    data: {
      orderId: data.orderId,
      type: data.type as OrderType,
      amount: data.amount,
      currency: data.currency,
      customerId: data.customerId,
      branchId: data.branchId,
      metadata: data.metadata,
      items: {
        create: data.items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
      },
    },
    include: { items: true, customer: true },
  });
}

export async function updateOrder(orderId: string, data: any) {
  return await prisma.order.update({
    where: { orderId },
    data,
  });
}

export async function getOrder(orderId: string) {
  return await prisma.order.findUnique({
    where: { orderId },
    include: { items: true, customer: true },
  });
}

export async function createTransaction(data: {
  transactionId: string;
  orderId: string;
  customerId: string;
  provider: string;
  amount: number;
  currency: string;
  metadata?: any;
}) {
  return await prisma.transaction.create({
    data: {
      transactionId: data.transactionId,
      orderId: data.orderId,
      customerId: data.customerId,
      provider: data.provider as PaymentProvider,
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
    },
  });
}

export async function updateTransaction(transactionId: string, data: any) {
  return await prisma.transaction.update({
    where: { transactionId },
    data,
  });
}

export async function getTransaction(transactionId: string) {
  return await prisma.transaction.findUnique({
    where: { transactionId },
    include: { order: true, customer: true },
  });
}

export async function createRevenue(data: {
  branchId: string;
  date: Date;
  type: string;
  category: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  orderId: string;
  transactionId: string;
  customerId: string;
  tax: number;
  discount: number;
  netAmount: number;
  commission: number;
  metadata?: any;
}) {
  return await prisma.revenue.create({
    data: {
      branchId: data.branchId,
      date: data.date,
      type: data.type as OrderType,
      category: data.category as any,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod as PaymentProvider,
      orderId: data.orderId,
      transactionId: data.transactionId,
      customerId: data.customerId,
      status: 'PENDING' as RevenueStatus,
      tax: data.tax,
      discount: data.discount,
      netAmount: data.netAmount,
      commission: data.commission,
      metadata: data.metadata,
    },
  });
}

export async function updateRevenue(id: string, data: any) {
  return await prisma.revenue.update({
    where: { id },
    data,
  });
}

export async function getBranchRevenue(branchId: string, startDate: Date, endDate: Date) {
  return await prisma.revenue.findMany({
    where: {
      branchId,
      date: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
    include: { order: true, customer: true },
    orderBy: { date: 'desc' },
  });
}

export async function getGlobalRevenue(startDate: Date, endDate: Date) {
  return await prisma.revenue.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
    include: { order: true, customer: true },
    orderBy: { date: 'desc' },
  });
}

export async function getRevenueAnalytics(branchId: string | null, period: string) {
  const { startDate, endDate } = getPeriodDates(period);
  
  const where: any = {
    date: { gte: startDate, lte: endDate },
    status: 'COMPLETED',
  };
  
  if (branchId) where.branchId = branchId;

  const [revenues, totalRevenue, totalTransactions] = await Promise.all([
    prisma.revenue.findMany({ where, include: { order: true } }),
    prisma.revenue.aggregate({ where, _sum: { netAmount: true } }),
    prisma.revenue.count({ where }),
  ]);

  const revenueByType = await prisma.revenue.groupBy({
    by: ['type'],
    where,
    _sum: { netAmount: true },
    _count: true,
  });

  const revenueByMethod = await prisma.revenue.groupBy({
    by: ['paymentMethod'],
    where,
    _sum: { netAmount: true },
    _count: true,
  });

  const revenueByCategory = await prisma.revenue.groupBy({
    by: ['category'],
    where,
    _sum: { netAmount: true },
    _count: true,
  });

  return {
    totalRevenue: totalRevenue._sum.netAmount || 0,
    totalTransactions,
    averageTransaction: totalTransactions > 0 ? (totalRevenue._sum.netAmount || 0) / totalTransactions : 0,
    revenueByType: Object.fromEntries(revenueByType.map(r => [r.type, r._sum.netAmount || 0])),
    revenueByMethod: Object.fromEntries(revenueByMethod.map(r => [r.paymentMethod, r._sum.netAmount || 0])),
    revenueByCategory: Object.fromEntries(revenueByCategory.map(r => [r.category, r._sum.netAmount || 0])),
    topPaymentMethods: revenueByMethod.map(r => ({
      method: r.paymentMethod,
      revenue: r._sum.netAmount || 0,
      count: r._count,
    })),
    topCategories: revenueByCategory.map(r => ({
      category: r.category,
      revenue: r._sum.netAmount || 0,
      percentage: ((r._sum.netAmount || 0) / (totalRevenue._sum.netAmount || 1)) * 100,
    })),
  };
}

export async function createNotification(data: {
  type: string;
  channel: string;
  recipient: string;
  subject?: string;
  message: string;
  metadata?: any;
}) {
  return await prisma.notification.create({
    data: {
      type: data.type as any,
      channel: data.channel,
      recipient: data.recipient,
      subject: data.subject,
      message: data.message,
      metadata: data.metadata,
    },
  });
}

export async function createReceipt(data: {
  receiptNumber: string;
  orderId: string;
  transactionId: string;
  customerId: string;
  html: string;
}) {
  return await prisma.receipt.create({
    data,
  });
}

function getPeriodDates(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { startDate, endDate };
}
