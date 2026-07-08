export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  emoji: string;
  special?: boolean;
}

export interface RestaurantSummary {
  id: string;
  name: string;
  description: string;
  emoji: string;
  coverClass: string;
  rating: number;
  deliveryTime: string;
  tags: string[];
}

export interface RestaurantDetail extends RestaurantSummary {
  menu: Record<string, MenuItem[]>;
}

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

export interface CartItem extends OrderItem {
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
  assignedCourierId?: string;
}

export interface CreateOrderPayload {
  loungeId: string;
  restaurantId: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  notes?: string;
}
