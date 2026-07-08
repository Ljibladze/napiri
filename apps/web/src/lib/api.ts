import type {
  CreateOrderPayload,
  Order,
  RestaurantDetail,
  RestaurantSummary,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('napiri_jwt');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const s = sessionStorage.getItem('napiri_user');
  return s ? JSON.parse(s) : null;
}

export function saveSession(token: string, user: any) {
  sessionStorage.setItem('napiri_jwt', token);
  sessionStorage.setItem('napiri_user', JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem('napiri_jwt');
  sessionStorage.removeItem('napiri_user');
  sessionStorage.removeItem('napiri_courier');
  sessionStorage.removeItem('napiri_admin');
  sessionStorage.removeItem('napiri_superadmin');
}

async function request<T>(path: string, init?: RequestInit, auth?: boolean): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}/api${path}`, { headers, ...init });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  restaurants: {
    list: () => request<RestaurantSummary[]>('/restaurants'),
    get: (id: string) => request<RestaurantDetail>(`/restaurants/${id}`),
    listAdmin: () => request<any[]>('/restaurants/admin/all', undefined, true),
    create: (body: any) => request<any>('/restaurants', { method: 'POST', body: JSON.stringify(body) }, true),
    update: (id: string, body: any) => request<any>(`/restaurants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, true),
    remove: (id: string) => request<any>(`/restaurants/${id}`, { method: 'DELETE' }, true),
  },
  orders: {
    list: (restaurantId?: string) => request<Order[]>(`/orders${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),
    get: (id: string) => request<Order>(`/orders/${id}`),
    create: (payload: CreateOrderPayload) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (id: string, status: Order['status'], courierId?: string) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, courierId }),
      }, true),
    assigned: () => request<Order[]>('/orders/assigned', undefined, true),
    byCourier: (courierId: string) => request<Order[]>(`/orders/courier/${courierId}`, undefined, true),
    courierStats: (restaurantId?: string) =>
      request<any[]>(`/orders/courier-stats${restaurantId ? `?restaurantId=${restaurantId}` : ''}`, undefined, true),
  },
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
  users: {
    me: () => request<any>('/users/me', undefined, true),
    list: () => request<any[]>('/users', undefined, true),
    create: (body: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(body) }, true),
    remove: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }, true),
    updatePassword: (id: string, password: string) =>
      request<any>(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }, true),
    setActive: (isActive: boolean) =>
      request<any>('/users/me/active', { method: 'PATCH', body: JSON.stringify({ isActive }) }, true),
    reassign: (id: string, restaurantId: string | null) =>
      request<any>(`/users/${id}/reassign`, { method: 'PATCH', body: JSON.stringify({ restaurantId }) }, true),
  },
  menu: {
    list: (restaurantId: string) => request<any[]>(`/menu/${restaurantId}`),
    create: (body: any) => request<any>('/menu', { method: 'POST', body: JSON.stringify(body) }, true),
    update: (id: string, body: any) => request<any>(`/menu/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, true),
    remove: (id: string) => request<any>(`/menu/${id}`, { method: 'DELETE' }, true),
  },
  stats: {
    get: (from?: string, to?: string) => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const q = params.toString();
      return request<any>(`/stats${q ? `?${q}` : ''}`, undefined, true);
    },
  },
};
