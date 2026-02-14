// Order Management Store - Zustand
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderType = "dine_in" | "room_service" | "takeaway";
export type PaymentMethodType =
  | "mtn_mobile"
  | "airtel_money"
  | "bank_transfer"
  | "paypal"
  | "cash";
export type OrderStatusType =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PlacedOrder {
  id: string;
  items: OrderItem[];
  orderType: OrderType;
  tableNumber?: string;
  roomNumber?: string;
  branchId: string;
  branchName: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethodType;
  status: OrderStatusType;
  subtotal: number;
  serviceCharge: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderStore {
  orders: PlacedOrder[];
  placeOrder: (order: Omit<PlacedOrder, "id" | "createdAt" | "updatedAt">) => string;
  updateOrderStatus: (orderId: string, status: OrderStatusType) => void;
  getOrdersByStatus: (status: OrderStatusType) => PlacedOrder[];
  getActiveOrders: () => PlacedOrder[];
  getTodayRevenue: () => number;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [
        // Seed demo orders for the waiter dashboard
        {
          id: "ORD-001",
          items: [
            { itemId: "bf-002", name: "Beef Steak", price: 8000, quantity: 2 },
            { itemId: "sd-001", name: "Assorted Soda", price: 1000, quantity: 2 },
          ],
          orderType: "dine_in",
          tableNumber: "T-05",
          branchId: "br-001",
          branchName: "Kigali Main",
          customerName: "Jean Baptiste",
          customerPhone: "+250788000001",
          paymentMethod: "mtn_mobile",
          status: "preparing",
          subtotal: 18000,
          serviceCharge: 900,
          grandTotal: 18900,
          createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          id: "ORD-002",
          items: [
            { itemId: "ch-002", name: "Roasted ¼ Chicken", price: 8000, quantity: 1 },
            { itemId: "ps-002", name: "Spaghetti Bolognaise", price: 6000, quantity: 1 },
            { itemId: "hb-002", name: "African Coffee", price: 2500, quantity: 2 },
          ],
          orderType: "room_service",
          roomNumber: "201",
          branchId: "br-001",
          branchName: "Kigali Main",
          customerName: "Sarah Mitchell",
          customerPhone: "+250788000002",
          paymentMethod: "cash",
          status: "pending",
          subtotal: 19000,
          serviceCharge: 950,
          grandTotal: 19950,
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: "ORD-003",
          items: [
            { itemId: "sp-001", name: "Akabenzi (0.5kg)", price: 6000, quantity: 2 },
            { itemId: "bbq-001", name: "Goat Brochette", price: 2000, quantity: 4 },
            { itemId: "be-001", name: "Primus (50cl)", price: 1500, quantity: 4 },
          ],
          orderType: "dine_in",
          tableNumber: "T-12",
          branchId: "br-002",
          branchName: "Ngoma Branch",
          customerName: "Patrick Niyonsaba",
          customerPhone: "+250788000003",
          paymentMethod: "airtel_money",
          status: "ready",
          subtotal: 26000,
          serviceCharge: 1300,
          grandTotal: 27300,
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
        },
        {
          id: "ORD-004",
          items: [
            { itemId: "ch-005", name: "East Gate Whole Pot Chicken", price: 20000, quantity: 1 },
            { itemId: "ac-002", name: "Fried Rice with Sauce", price: 2000, quantity: 2 },
          ],
          orderType: "dine_in",
          tableNumber: "T-03",
          branchId: "br-001",
          branchName: "Kigali Main",
          customerName: "Diane Uwimana",
          customerPhone: "+250788000004",
          paymentMethod: "bank_transfer",
          status: "served",
          subtotal: 24000,
          serviceCharge: 1200,
          grandTotal: 25200,
          createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
      ],

      placeOrder: (orderData) => {
        const id = `ORD-${String(get().orders.length + 1).padStart(3, "0")}`;
        const now = new Date().toISOString();
        const newOrder: PlacedOrder = {
          ...orderData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          orders: [newOrder, ...state.orders],
        }));
        return id;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      getOrdersByStatus: (status) => {
        return get().orders.filter((o) => o.status === status);
      },

      getActiveOrders: () => {
        return get().orders.filter(
          (o) => o.status !== "served" && o.status !== "cancelled"
        );
      },

      getTodayRevenue: () => {
        const today = new Date().toDateString();
        return get()
          .orders.filter(
            (o) =>
              new Date(o.createdAt).toDateString() === today &&
              o.status !== "cancelled"
          )
          .reduce((sum, o) => sum + o.grandTotal, 0);
      },
    }),
    {
      name: "eastgate-orders-storage",
    }
  )
);
