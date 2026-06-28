'use client';

import { useState } from 'react';
import type { Order } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { formatPrice, formatTime } from '@/lib/utils';
import { playStatusChange } from '@/lib/sounds';
import { useLang } from '@/contexts/LanguageContext';
import type { TKey } from '@/lib/translations';

interface OrderSuccessProps {
  order: Order;
  onNewOrder: () => void;
}

const STATUS_STEPS: Order['status'][] = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'];

const STEP_ICON: Record<string, string> = {
  pending:    '🕐',
  confirmed:  '✅',
  preparing:  '👨‍🍳',
  delivering: '🏃',
  delivered:  '🎉',
};

const STATUS_T: Record<string, TKey> = {
  pending:    's_pending',
  confirmed:  's_confirmed',
  preparing:  's_preparing',
  delivering: 's_delivering',
  delivered:  's_delivered',
  cancelled:  's_cancelled',
};

const STEP_DESC_T: Record<string, TKey> = {
  pending:    'step_pending_desc',
  confirmed:  'step_confirmed_desc',
  preparing:  'step_preparing_desc',
  delivering: 'step_delivering_desc',
  delivered:  'step_delivered_desc',
};

export function OrderSuccess({ order: initialOrder, onNewOrder }: OrderSuccessProps) {
  const { t } = useLang();
  const [order, setOrder] = useState<Order>(initialOrder);

  useSocket({
    'order-updated': (data) => {
      const updated = data as Order;
      if (updated.id === order.id) {
        setOrder(updated);
        playStatusChange();
      }
    },
  });

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isDone = order.status === 'delivered';

  return (
    <div className="animate-fade-in space-y-5 px-4 pb-10 pt-2">

      {/* ── Hero ─────────────────────────────────── */}
      <div className="text-center pt-4 space-y-4">

        {/* Status icon with glow */}
        <div className="relative inline-flex items-center justify-center">
          {!isDone && (
            <>
              <div className={`absolute rounded-full animate-pulse-ring opacity-40 w-24 h-24 s-ring-${order.status}`} />
              <div className={`absolute rounded-full animate-pulse-ring opacity-20 w-24 h-24 s-ring-${order.status} [animation-delay:0.5s]`} />
            </>
          )}
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-5xl s-hero-${order.status} s-glow-${order.status}`}>
            {isDone ? '🎉' : STEP_ICON[order.status]}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black text-white">
            {isDone ? t('bon_appetit') : t('order_received')}
          </h2>
          <p className="text-white/45 text-sm mt-1.5 font-medium">{t(STEP_DESC_T[order.status] ?? 'step_pending_desc')}</p>
        </div>

        {/* Order ID chip */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-white/[0.06] border border-white/[0.10]">
          <span className="text-white/35 font-medium">{t('order_id_label')}</span>
          <span className="text-sky-400 font-mono">#{order.id.slice(-6)}</span>
        </div>
      </div>

      {/* ── Progress stepper ─────────────────────── */}
      <div className="rounded-3xl p-5 surface">
        <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4">{t('order_status_title')}</p>
        <div className="space-y-0">
          {STATUS_STEPS.map((step, idx) => {
            const done    = idx < currentStep;
            const current = idx === currentStep;
            return (
              <div key={step} className="flex items-start gap-4">
                {/* Track line + circle */}
                <div className="flex flex-col items-center shrink-0 w-8">
                  <div className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500',
                    done    ? 'bg-green-500/20 border border-green-500/[0.5] text-green-300'
                    : current ? `s-step-${step}`
                    : 'bg-white/[0.04] border border-white/[0.08] text-white/20',
                  ].join(' ')}>
                    {done ? '✓' : STEP_ICON[step]}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`w-px h-5 my-1 transition-all duration-700 ${done ? 'bg-green-500/30' : 'bg-white/[0.07]'}`} />
                  )}
                </div>

                {/* Text */}
                <div className="py-1.5 flex-1 flex items-start justify-between gap-2">
                  <div>
                    <p className={[
                      'text-sm font-bold transition-all duration-300',
                      done    ? 'text-white/30 line-through'
                      : current ? 'text-white'
                      : 'text-white/20',
                    ].join(' ')}>
                      {t(STATUS_T[step])}
                    </p>
                    {current && (
                      <p className="text-white/35 text-xs mt-0.5 font-medium">{t(STEP_DESC_T[step] ?? 'step_pending_desc')}</p>
                    )}
                  </div>

                  {current && (
                    <div className={`flex items-center gap-1 shrink-0 text-xs font-bold px-2 py-0.5 rounded-full s-live-${step}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse s-dot-${step}`} />
                      {t('live_badge')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Order summary ────────────────────────── */}
      <div className="rounded-3xl overflow-hidden surface">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{order.restaurantEmoji}</span>
            <span className="font-bold text-white text-base">{order.restaurantName}</span>
          </div>
          <span className="text-white/30 text-sm font-medium">{formatTime(order.createdAt)}</span>
        </div>

        <div className="px-5 py-4 space-y-2.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-white/60 text-sm font-medium">
                {item.emoji} {item.name}
                <span className="text-white/30 ml-1.5 font-normal">×{item.quantity}</span>
              </span>
              <span className="text-white font-semibold text-sm">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.07] bg-white/[0.03]">
          <span className="text-white/40 text-sm font-medium">{t('total')}</span>
          <span className="text-white font-black text-2xl">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* ── New order button ─────────────────────── */}
      <button
        onClick={onNewOrder}
        className="w-full py-4 rounded-2xl font-bold text-white/60 hover:text-white transition-all active:scale-[0.98] bg-white/[0.05] border border-white/[0.10]"
      >
        {t('new_order_action')}
      </button>
    </div>
  );
}
