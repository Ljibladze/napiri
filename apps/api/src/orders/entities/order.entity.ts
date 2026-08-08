export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'terminal' | 'transfer';
export type DeliveryType = 'pickup' | 'delivery';

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
  serviceCharge: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  phoneNumber?: string;
  courierId?: string;
  assignedCourierId?: string;
}
