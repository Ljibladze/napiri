export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'terminal' | 'transfer';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
  special?: boolean;
}

export interface Order {
  id: string;
  loungeId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantEmoji: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  courierId?: string;
}
