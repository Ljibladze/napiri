import type {
  CreateOrderPayload,
  Order,
  RestaurantDetail,
  RestaurantSummary,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
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
  },
  orders: {
    list: () => request<Order[]>('/orders'),
    get: (id: string) => request<Order>(`/orders/${id}`),
    create: (payload: CreateOrderPayload) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (id: string, status: Order['status']) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
};
