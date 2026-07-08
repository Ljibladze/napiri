import type {
  CreateOrderPayload,
  Order,
  RestaurantDetail,
  RestaurantSummary,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('napiri_jwt');
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
    list: () => request<Order[]>('/orders'),
    get: (id: string) => request<Order>(`/orders/${id}`),
    create: (payload: CreateOrderPayload) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (id: string, status: Order['status']) =>
      request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: { id: string; username: string; role: string; restaurantId: string | null } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ username, password }) },
      ),
  },
  users: {
    list: () => request<any[]>('/users', undefined, true),
    create: (body: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(body) }, true),
    remove: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }, true),
    updatePassword: (id: string, password: string) =>
      request<any>(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }, true),
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
