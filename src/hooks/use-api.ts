import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────

interface Booking {
    id: string;
    bookingNumber: string;
    guestName: string;
    roomNumber: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    totalAmount: number;
    guest?: any;
    room?: any;
}

interface Room {
    id: string;
    number: string;
    floor: number;
    type: string;
    status: string;
    price: number;
    currentGuest?: any;
}

interface Order {
    id: string;
    orderNumber: string;
    tableNumber?: number;
    items: any[];
    status: string;
    total: number;
}

interface Guest {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    loyaltyTier?: string;
    loyaltyPoints: number;
}

interface Analytics {
    kpi: {
        totalRevenue: number;
        restaurantRevenue: number;
        occupancyRate: number;
        adr: number;
        revpar: number;
        todayCheckIns: number;
        todayCheckOuts: number;
    };
    roomStatusBreakdown: any[];
    recentBookings: Booking[];
}

// ─── Bookings ─────────────────────────────────────────────────

export function useBookings(filters?: { branchId?: string; status?: string }) {
    return useQuery({
        queryKey: ['bookings', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);

            const res = await fetch(`/api/bookings?${params}`);
            if (!res.ok) throw new Error('Failed to fetch bookings');
            return res.json() as Promise<Booking[]>;
        },
    });
}

export function useBooking(id: string) {
    return useQuery({
        queryKey: ['booking', id],
        queryFn: async () => {
            const res = await fetch(`/api/bookings/${id}`);
            if (!res.ok) throw new Error('Failed to fetch booking');
            return res.json() as Promise<Booking>;
        },
        enabled: !!id,
    });
}

export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create booking');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
}

export function useUpdateBooking(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update booking');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['booking', id] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
}

// ─── Rooms ────────────────────────────────────────────────────

export function useRooms(filters?: {
    branchId?: string;
    status?: string;
    type?: string;
    available?: boolean;
    checkIn?: string;
    checkOut?: string;
}) {
    return useQuery({
        queryKey: ['rooms', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.type) params.append('type', filters.type);
            if (filters?.available) params.append('available', 'true');
            if (filters?.checkIn) params.append('checkIn', filters.checkIn);
            if (filters?.checkOut) params.append('checkOut', filters.checkOut);

            const res = await fetch(`/api/rooms?${params}`);
            if (!res.ok) throw new Error('Failed to fetch rooms');
            return res.json() as Promise<Room[]>;
        },
    });
}

export function useUpdateRoom(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/rooms/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update room');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
}

// ─── Orders ───────────────────────────────────────────────────

export function useOrders(filters?: { branchId?: string; status?: string; today?: boolean }) {
    return useQuery({
        queryKey: ['orders', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.today) params.append('today', 'true');

            const res = await fetch(`/api/orders?${params}`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json() as Promise<Order[]>;
        },
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create order');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
}

export function useUpdateOrder(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update order');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
}

// ─── Guests ───────────────────────────────────────────────────

export function useGuests(filters?: { branchId?: string; search?: string }) {
    return useQuery({
        queryKey: ['guests', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.search) params.append('search', filters.search);

            const res = await fetch(`/api/guests?${params}`);
            if (!res.ok) throw new Error('Failed to fetch guests');
            return res.json() as Promise<Guest[]>;
        },
    });
}

export function useGuest(id: string) {
    return useQuery({
        queryKey: ['guest', id],
        queryFn: async () => {
            const res = await fetch(`/api/guests/${id}`);
            if (!res.ok) throw new Error('Failed to fetch guest');
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateGuest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/guests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create guest');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guests'] });
        },
    });
}

// ─── Menu ─────────────────────────────────────────────────────

export function useMenuItems(filters?: { category?: string; available?: boolean }) {
    return useQuery({
        queryKey: ['menu', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.category) params.append('category', filters.category);
            if (filters?.available) params.append('available', 'true');

            const res = await fetch(`/api/menu?${params}`);
            if (!res.ok) throw new Error('Failed to fetch menu items');
            return res.json();
        },
    });
}

// ─── Analytics ────────────────────────────────────────────────

export function useAnalytics(filters?: { branchId?: string; period?: string }) {
    return useQuery({
        queryKey: ['analytics', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.period) params.append('period', filters.period);

            const res = await fetch(`/api/analytics/dashboard?${params}`);
            if (!res.ok) throw new Error('Failed to fetch analytics');
            return res.json() as Promise<Analytics>;
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

// ─── Events ───────────────────────────────────────────────────

export function useEvents(filters?: { branchId?: string; status?: string; from?: string; to?: string }) {
    return useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.from) params.append('from', filters.from);
            if (filters?.to) params.append('to', filters.to);

            const res = await fetch(`/api/events?${params}`);
            if (!res.ok) throw new Error('Failed to fetch events');
            return res.json();
        },
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create event');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
    });
}

// ─── Services ─────────────────────────────────────────────────

export function useServices(filters?: { branchId?: string; status?: string; type?: string; department?: string }) {
    return useQuery({
        queryKey: ['services', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.type) params.append('type', filters.type);
            if (filters?.department) params.append('department', filters.department);

            const res = await fetch(`/api/services?${params}`);
            if (!res.ok) throw new Error('Failed to fetch services');
            return res.json();
        },
    });
}

export function useCreateService() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create service request');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
    });
}

// ─── Staff ────────────────────────────────────────────────────

export function useStaff(filters?: { branchId?: string; role?: string; status?: string }) {
    return useQuery({
        queryKey: ['staff', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.branchId) params.append('branchId', filters.branchId);
            if (filters?.role) params.append('role', filters.role);
            if (filters?.status) params.append('status', filters.status);

            const res = await fetch(`/api/staff?${params}`);
            if (!res.ok) throw new Error('Failed to fetch staff');
            return res.json();
        },
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create staff member');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}

// ─── Branches ─────────────────────────────────────────────────

export function useBranches(filters?: { analytics?: boolean; stats?: boolean }) {
    return useQuery({
        queryKey: ['branches', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.analytics) params.append('analytics', 'true');
            if (filters?.stats) params.append('stats', 'true');

            const res = await fetch(`/api/branches?${params}`);
            if (!res.ok) throw new Error('Failed to fetch branches');
            return res.json();
        },
    });
}

export function useBranch(id: string) {
    return useQuery({
        queryKey: ['branch', id],
        queryFn: async () => {
            const res = await fetch(`/api/branches/${id}`);
            if (!res.ok) throw new Error('Failed to fetch branch');
            return res.json();
        },
        enabled: !!id,
    });
}

export function useUpdateBranch(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/branches/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update branch');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            queryClient.invalidateQueries({ queryKey: ['branch', id] });
        },
    });
}

// ─── Payments ─────────────────────────────────────────────────

export function useCreatePaymentIntent() {
    return useMutation({
        mutationFn: async (data: {
            amount: number;
            currency?: string;
            bookingId?: string;
            eventId?: string;
            description?: string;
        }) => {
            const res = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create payment intent');
            return res.json();
        },
    });
}
