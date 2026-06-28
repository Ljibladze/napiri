'use client';

import { useState } from 'react';
import type { CartItem, PaymentMethod } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useLang } from '@/contexts/LanguageContext';
import type { TKey } from '@/lib/translations';

interface CartSheetProps {
  items: CartItem[];
  restaurantName: string;
  restaurantEmoji: string;
  loungeId: string;
  onUpdateQuantity: (id: string, qty: number) => void;
  onClose: () => void;
  onSubmit: (paymentMethod: PaymentMethod, notes: string) => Promise<void>;
}

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'terminal', 'transfer'];
const PAYMENT_ICON: Record<PaymentMethod, string> = { cash: '💵', terminal: '💳', transfer: '📱' };
const PAYMENT_T: Record<PaymentMethod, TKey> = { cash: 'pay_cash', terminal: 'pay_terminal', transfer: 'pay_transfer' };

export function CartSheet({
  items, restaurantName, restaurantEmoji, loungeId,
  onUpdateQuantity, onClose, onSubmit,
}: CartSheetProps) {
  const { t } = useLang();
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const total      = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  async function handleOrder() {
    setLoading(true);
    try { await onSubmit(payment, notes); }
    finally { setLoading(false); }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xl z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden animate-slide-up flex flex-col cart-sheet-bg max-h-[92dvh]">
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/[0.18]" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xl font-black text-white">{t('cart')}</h3>
            <p className="text-white/40 text-sm mt-0.5">
              {restaurantEmoji} {restaurantName} ·
              <span className="text-sky-400 font-bold"> {t('lounge_label')} #{loungeId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90 bg-white/[0.08] border border-white/[0.08]"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Items list */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl ${item.special ? 'bg-amber-400/[0.08] border border-amber-400/[0.2]' : 'bg-white/[0.05] border border-white/[0.07]'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${item.special ? 'bg-amber-400/[0.15]' : 'bg-white/[0.08]'}`}>
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm leading-tight truncate ${item.special ? 'text-amber-100' : 'text-white'}`}>{item.name}</p>
                  <p className={`font-bold text-sm mt-0.5 ${item.special ? 'text-amber-400' : 'text-sky-300'}`}>{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all active:scale-90 bg-white/[0.10] border border-white/[0.08]"
                  >−</button>
                  <span className="w-6 text-center font-black text-white text-base">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-lg transition-all active:scale-90 bg-btn-ocean"
                  >+</button>
                </div>
                <span className="text-white font-bold text-sm w-14 text-right shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Total row */}
          <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.10]">
            <span className="text-white/50 text-sm font-medium">{totalItems} {t('items_suffix')}</span>
            <span className="text-white font-black text-2xl">{formatPrice(total)}</span>
          </div>

          {/* Payment method */}
          <div className="space-y-3">
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">{t('payment_method')}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {PAYMENT_METHODS.map((m) => {
                const active = payment === m;
                return (
                  <button
                    key={m}
                    onClick={() => setPayment(m)}
                    className={[
                      'flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95',
                      active
                        ? 'bg-ocean-600/[0.15] border-2 border-ocean-600/[0.5] shadow-[0_0_20px_rgba(0,180,216,0.15)]'
                        : 'bg-white/[0.05] border-2 border-white/[0.08]',
                    ].join(' ')}
                  >
                    <span className="text-2xl">{PAYMENT_ICON[m]}</span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${active ? 'text-sky-400' : 'text-white/40'}`}>
                      {t(PAYMENT_T[m])}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2.5">
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">{t('note_optional')}</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('note_ph')}
              rows={2}
              className={[
                'w-full rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none transition-all field-sizing-content',
                notesFocused
                  ? 'ring-2 ring-ocean-600/50 bg-white/[0.08] border border-ocean-600/30'
                  : 'bg-white/[0.05] border border-white/[0.08]',
              ].join(' ')}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
            />
          </div>
        </div>

        {/* Order CTA */}
        <div className="px-5 pb-8 pt-4 shrink-0 border-t border-white/[0.07]">
          <button
            onClick={handleOrder}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-btn-sand shadow-sand"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>{t('sending')}</span>
              </>
            ) : (
              <>
                <span>{t('order_btn')}</span>
                <span className="rounded-xl px-2.5 py-1 text-sm font-black bg-black/20">
                  {formatPrice(total)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
