'use client';

import type { Order, OrderStatus } from '@/types';
import { formatPrice, formatRelativeTime, NEXT_STATUS, PAYMENT_ICON, PAYMENT_LABEL, STATUS_LABEL } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  isNew?: boolean;
}

export function OrderCard({ order, onStatusChange, isNew = false }: OrderCardProps) {
  const next = NEXT_STATUS[order.status];
  const canCancel = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <div className={[
      'overflow-hidden rounded-3xl transition-all duration-500 bg-white/[0.05] backdrop-blur-2xl',
      `order-bl-${order.status}`,
      isNew
        ? 'border border-ocean-600/40 shadow-[0_16px_48px_rgba(0,180,216,0.2),_0_4px_16px_rgba(0,0,0,0.4)] animate-pop-in'
        : 'border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    ].join(' ')}>
      {/* ── Header ──────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">

          {/* Status + new badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold s-badge-${order.status}`}>
              <span className={`w-1.5 h-1.5 rounded-full s-dot-${order.status} ${order.status === 'pending' ? 'animate-pulse' : ''}`} />
              {STATUS_LABEL[order.status]}
            </span>

            {isNew && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold animate-pulse bg-ocean-600/20 border border-ocean-600/40 text-sky-300">
                ✨ ახალი შეკვეთა
              </span>
            )}
          </div>

          {/* Restaurant */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{order.restaurantEmoji}</span>
            <span className="text-white font-black text-base">{order.restaurantName}</span>
            <span className="text-white/20 font-mono text-xs">#{order.id.slice(-4)}</span>
          </div>
        </div>

        {/* Lounge badge */}
        <div className="shrink-0 min-w-[72px] text-center py-2 px-3 rounded-2xl bg-white/[0.08] border border-white/[0.12]">
          <div className="text-3xl font-black text-white leading-tight">#{order.loungeId}</div>
          <div className="text-white/35 text-[9px] font-bold uppercase tracking-widest mt-0.5">შეზლონგი</div>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────── */}
      <div className="mx-5 border-t border-white/[0.06]" />

      {/* ── Items ──────────────────────────────────── */}
      <div className="px-5 py-3 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-white/65 font-medium">
              <span className="text-base">{item.emoji}</span>
              <span>{item.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-white/[0.08] text-white/40">
                ×{item.quantity}
              </span>
            </span>
            <span className="text-white/60 font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}

        {order.notes && (
          <div className="flex items-start gap-2 mt-2 text-xs rounded-xl px-3 py-2.5 bg-amber-400/[0.08] border border-amber-400/20 text-amber-300/85">
            <span>📝</span>
            <span className="font-medium">{order.notes}</span>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────── */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap bg-black/15 border-t border-white/[0.05]">
        {/* Payment + total */}
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-sm font-medium">
            {PAYMENT_ICON[order.paymentMethod]} {PAYMENT_LABEL[order.paymentMethod]}
          </span>
          <span className="text-white font-black text-xl">{formatPrice(order.total)}</span>
        </div>

        {/* Time + action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-white/25 text-xs font-medium">{formatRelativeTime(order.createdAt)}</span>

          {next && (
            <button
              onClick={() => onStatusChange(order.id, next.status)}
              className="px-3.5 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95 bg-btn-ocean shadow-ocean"
            >
              {next.label} ›
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="w-9 h-9 rounded-xl text-sm flex items-center justify-center transition-all active:scale-90 font-bold bg-red-500/15 border border-red-500/25 text-red-400"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
