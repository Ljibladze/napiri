import type { OrderStatus, PaymentMethod } from '@/types';

export function formatPrice(amount: number): string {
  return `₾${amount.toFixed(2).replace('.00', '')}`;
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('ka-GE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff} წმ წინ`;
  if (diff < 3600) return `${Math.floor(diff / 60)} წთ წინ`;
  return `${Math.floor(diff / 3600)} სთ წინ`;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'მოლოდინი',
  confirmed: 'დადასტურდა',
  preparing: 'მზადდება',
  delivering: 'გზაშია',
  delivered: 'ჩაბარდა',
  cancelled: 'გაუქმდა',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
  confirmed: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
  preparing: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  delivering: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
  delivered: 'bg-green-400/20 text-green-300 border-green-400/30',
  cancelled: 'bg-red-400/20 text-red-300 border-red-400/30',
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  preparing: 'bg-orange-400',
  delivering: 'bg-purple-400',
  delivered: 'bg-green-400',
  cancelled: 'bg-red-400',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'ნაღდი ფული',
  terminal: 'ბარათი / ტერმინალი',
  transfer: 'გადარიცხვა',
};

export const PAYMENT_ICON: Record<PaymentMethod, string> = {
  cash: '💵',
  terminal: '💳',
  transfer: '📱',
};

export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'confirmed', label: 'დადასტურება' },
  confirmed: { status: 'preparing', label: 'მზარეულთან' },
  preparing: { status: 'delivering', label: 'გზაშია' },
};
