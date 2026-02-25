# Complete Developer Integration Guide

## 🚀 Getting Started with i18n & Advanced APIs

This guide walks you through integrating the new internationalization system and production-ready APIs into your components and pages.

---

## Part 1: Setting Up Internationalization

### Step 1: Wrap Your App with LocaleProvider

In your root layout file (`src/app/layout.tsx`):

```typescript
import { LocaleProvider } from '@/lib/i18n/useTranslation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* Other head content */}
      </head>
      <body>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
```

### Step 2: Use Translations in Components

```typescript
'use client';

import { useLocale } from '@/lib/i18n/useTranslation';

export default function HeroSection() {
  const { t, locale, setLocale } = useLocale();

  return (
    <section>
      <h1>{t('hero', 'title')}</h1>
      <p>{t('hero', 'subtitle')}</p>
      <button onClick={() => setLocale('fr')}>
        {t('common', 'language')}
      </button>
    </section>
  );
}
```

### Step 3: Create Language Selector Component

```typescript
'use client';

import { useLocale } from '@/lib/i18n/useTranslation';
import { SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/config';

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <select 
      value={locale} 
      onChange={(e) => setLocale(e.target.value as Language)}
      className="border rounded px-3 py-2"
    >
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, { nativeName, flag }]) => (
        <option key={code} value={code}>
          {flag} {nativeName}
        </option>
      ))}
    </select>
  );
}
```

---

## Part 2: Authentication & API Integration

### Step 1: Get JWT Token

First, authenticate the user and get a JWT token. This typically happens in your auth/login component:

```typescript
async function loginUser(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.token) {
    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    return data.token;
  }
}
```

### Step 2: Create API Client Helper

Create a utility to handle all API calls with authentication:

```typescript
// src/lib/api-client.ts

export class APIClient {
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '';

  private getToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || '';
    }
    return '';
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }
}

export const apiClient = new APIClient();
```

---

## Part 3: Reception Component Integration

### Example: Guest Check-In Form

```typescript
'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api-client';

interface CheckInFormData {
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
}

export function GuestCheckInForm() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckInFormData>({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.post('/api/receptionist/register-guest', formData);
      
      if (result.success) {
        alert(t('common', 'success'));
        // Reset form
        setFormData({
          name: '', email: '', phone: '', idNumber: '',
          roomId: '', checkIn: '', checkOut: '', numberOfGuests: 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2">
          {t('common', 'name')} *
        </label>
        <input
          type="text"
          required
          minLength={2}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block mb-2">
          {t('common', 'email')}
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block mb-2">
          {t('common', 'phone')} *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block mb-2">
          {t('booking', 'checkIn')} *
        </label>
        <input
          type="datetime-local"
          required
          value={formData.checkIn}
          onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block mb-2">
          {t('booking', 'checkOut')} *
        </label>
        <input
          type="datetime-local"
          required
          value={formData.checkOut}
          onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {loading ? t('common', 'loading') : t('booking', 'createBooking')}
      </button>
    </form>
  );
}
```

---

## Part 4: Kitchen Component Integration

### Example: Kitchen Display System (KDS)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api-client';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: string;
  items: any[];
  booking: { roomNumber: number; guestName: string };
  estimatedCompletionTime: string;
}

export function KitchenDisplaySystem() {
  const { t } = useLocale();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const result = await apiClient.get('/api/kitchen/orders?status=pending');
      if (result.success) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiClient.put('/api/kitchen/orders', {
        orderId,
        status,
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  if (loading) {
    return <div>{t('common', 'loading')}</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 bg-white">
          <div className="font-bold text-lg">
            {t('order', 'orderNumber')}: {order.orderNumber}
          </div>
          
          <div className="text-sm text-gray-600">
            {t('common', 'room')}: {order.booking.roomNumber}
            {' - '}
            {order.booking.guestName}
          </div>

          <div className="mt-3 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="text-sm">
                {item.quantity}x {item.menuItem.name}
                {item.menuItem.preparationTime && (
                  <span className="text-gray-500 ml-2">
                    ({item.menuItem.preparationTime}min)
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              className="w-full bg-yellow-500 text-white py-1 rounded text-sm"
            >
              {t('order', 'preparing')}
            </button>
            <button
              onClick={() => updateOrderStatus(order.id, 'ready')}
              className="w-full bg-green-500 text-white py-1 rounded text-sm"
            >
              {t('order', 'ready')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Part 5: Waiter Component Integration

### Example: Waiter Dashboard

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api-client';

interface WaiterDashboardData {
  activeOrders: any[];
  todayStats: {
    totalOrders: number;
    completedOrders: number;
    revenue: number;
    estimatedTips: number;
  };
  recentOrders: any[];
}

export function WaiterDashboard() {
  const { t } = useLocale();
  const [data, setData] = useState<WaiterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await apiClient.get('/api/waiter/dashboard');
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOrder = async (orderId: string) => {
    try {
      await apiClient.put('/api/waiter/dashboard', {
        orderId,
        action: 'complete',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  if (loading || !data) {
    return <div>{t('common', 'loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-gray-600 text-sm">
            {t('admin', 'revenue')}
          </div>
          <div className="text-2xl font-bold">
            ${data.todayStats.revenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-gray-600 text-sm">
            {t('common', 'guests')}
          </div>
          <div className="text-2xl font-bold">
            {data.todayStats.totalOrders}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-gray-600 text-sm">
            Estimated Tips
          </div>
          <div className="text-2xl font-bold text-green-600">
            ${data.todayStats.estimatedTips.toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-gray-600 text-sm">
            {t('order', 'completed')}
          </div>
          <div className="text-2xl font-bold">
            {data.todayStats.completedOrders}
          </div>
        </div>
      </div>

      {/* Active Orders */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {t('order', 'status')}: {t('order', 'ready')}
        </h2>
        <div className="space-y-3">
          {data.activeOrders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold">
                    {t('common', 'room')} {order.booking.roomNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.booking.guestName}
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  ${order.total.toFixed(2)}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                {order.items.map((item: any) => (
                  <div key={item.id}>
                    {item.quantity}x {item.menuItem.name}
                  </div>
                ))}
              </div>

              <button
                onClick={() => completeOrder(order.id)}
                className="w-full bg-blue-600 text-white py-2 rounded text-sm"
              >
                {t('order', 'served')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Part 6: Error Handling

### Create a Global Error Handler

```typescript
// src/lib/error-handler.ts

import { useLocale } from '@/lib/i18n/useTranslation';

export function useErrorHandler() {
  const { t } = useLocale();

  const handleError = (error: any): string => {
    if (error.message === 'Unauthorized') {
      return t('messages', 'unauthorized');
    }

    if (error.message === 'Forbidden') {
      return t('messages', 'forbidden');
    }

    if (error.message.includes('Room is not available')) {
      return t('booking', 'roomNotAvailable');
    }

    return error.message || t('messages', 'error');
  };

  return { handleError };
}
```

---

## Part 7: TypeScript Types

### Create Type Definitions

```typescript
// src/types/api.ts

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  roomNumber: number;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  totalAmount: number;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  createdAt: string;
  readyAt?: string;
  completedAt?: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  menuItem: {
    id: string;
    name: string;
    price: number;
    preparationTime: number;
  };
}

export interface WaiterOrder extends KitchenOrder {
  booking: {
    roomNumber: number;
    guestName: string;
  };
  total: number;
}
```

---

## 🎯 Common Tasks Checklist

- [ ] Wrap app with `LocaleProvider` in root layout
- [ ] Import `useLocale` in all user-facing components
- [ ] Replace hardcoded strings with `t('namespace', 'key')`
- [ ] Create `APIClient` for authenticated requests
- [ ] Add JWT token retrieval after login
- [ ] Implement error handling with translated messages
- [ ] Test all components in different languages
- [ ] Test all API endpoints with Bearer token
- [ ] Handle 401/403 errors with login redirect
- [ ] Add loading states to all API calls
- [ ] Implement auto-refresh for dashboards
- [ ] Test on mobile and tablet viewports

---

## 🚨 Troubleshooting

**Translation Key Not Found**
- Verify namespace exists in `translations.ts`
- Check key spelling matches exactly
- Fallback to English if key doesn't exist

**API Returns 401 Unauthorized**
- Check JWT token is valid
- Verify token is included in Authorization header
- Check token hasn't expired

**API Returns 403 Forbidden**
- Verify user role in database
- Check user belongs to correct branch
- Admin users can access all branches

**Component Not Using Translations**
- Ensure component is marked as `'use client'`
- Verify `LocaleProvider` wraps the component
- Check `useLocale()` is called inside component

---

## 📚 Next Steps

1. Review the complete file: `src/I18N_AND_ADVANCED_APIS_COMPLETE.md`
2. Check the quick reference: `I18N_AND_APIS_QUICK_REFERENCE.md`
3. Examine the updated components in `src/components/`
4. Review the API files in `src/app/api/`
5. Test all endpoints using the provided curl examples

---

**Status**: ✅ Ready for Implementation
**Last Updated**: January 15, 2024
**Version**: 3.0
