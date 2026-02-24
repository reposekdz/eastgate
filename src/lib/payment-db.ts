// Payment Transaction Schema
export interface PaymentTransaction {
  id: string;
  orderId: string;
  type: "booking" | "order" | "menu" | "event" | "spa" | "service";
  provider: "stripe" | "paypal" | "flutterwave" | "mtn" | "airtel" | "bank";
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  transactionId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  branchId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Order Schema
export interface Order {
  id: string;
  orderId: string;
  type: "booking" | "order" | "menu" | "event" | "spa";
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  items: OrderItem[];
  customer: Customer;
  branchId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
}

// In-memory storage (replace with database in production)
export const transactions: Map<string, PaymentTransaction> = new Map();
export const orders: Map<string, Order> = new Map();

export async function createTransaction(data: Omit<PaymentTransaction, "id" | "createdAt" | "updatedAt">): Promise<PaymentTransaction> {
  const transaction: PaymentTransaction = {
    ...data,
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  transactions.set(transaction.id, transaction);
  return transaction;
}

export async function updateTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction | null> {
  const transaction = transactions.get(id);
  if (!transaction) return null;
  
  const updated = { ...transaction, ...updates, updatedAt: new Date() };
  transactions.set(id, updated);
  return updated;
}

export async function getTransaction(id: string): Promise<PaymentTransaction | null> {
  return transactions.get(id) || null;
}

export async function getTransactionByOrderId(orderId: string): Promise<PaymentTransaction | null> {
  for (const transaction of transactions.values()) {
    if (transaction.orderId === orderId) return transaction;
  }
  return null;
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
  const order: Order = {
    ...data,
    id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  orders.set(order.id, order);
  return order;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  const order = orders.get(id);
  if (!order) return null;
  
  const updated = { ...order, ...updates, updatedAt: new Date() };
  orders.set(id, updated);
  return updated;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  for (const order of orders.values()) {
    if (order.orderId === orderId) return order;
  }
  return null;
}
