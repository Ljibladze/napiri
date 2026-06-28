'use client';

import { useState } from 'react';
import type { RestaurantDetail, MenuItem, CartItem } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useLang } from '@/contexts/LanguageContext';

interface MenuViewProps {
  restaurant: RestaurantDetail;
  cartItems: CartItem[];
  onAdd: (item: MenuItem) => void;
  onRemove: (itemId: string) => void;
  onBack: () => void;
  onOpenCart: () => void;
  cartTotal: number;
  cartCount: number;
}

export function MenuView({
  restaurant, cartItems, onAdd, onRemove,
  onBack, onOpenCart, cartTotal, cartCount,
}: MenuViewProps) {
  const { t } = useLang();
  const categories = Object.keys(restaurant.menu);
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '');

  const getQty = (id: string) => cartItems.find((i) => i.id === id)?.quantity ?? 0;

  return (
    <div className="flex flex-col min-h-dvh animate-fade-in">

      {/* ── Gradient hero header ─────────────────────── */}
      <div className={`${restaurant.coverClass} relative px-5 pt-5 pb-8 overflow-hidden`}>
        {/* Back button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-white font-semibold text-sm mb-5 px-4 py-2 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 transition-all active:scale-95"
        >
          {t('back')}
        </button>

        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.12]" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/[0.10]" />

        {/* Restaurant info */}
        <div className="relative flex items-end gap-4">
          <span className="text-7xl leading-none select-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            {restaurant.emoji}
          </span>
          <div className="pb-1">
            <h1 className="text-3xl font-black text-white leading-tight">{restaurant.name}</h1>
            <p className="text-white/70 text-sm mt-0.5">{restaurant.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-white">
                <span className="text-yellow-400">★</span> {restaurant.rating}
              </span>
              <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-md text-white/80">
                🕐 {restaurant.deliveryTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category tabs ─────────────────────────────── */}
      <div className="sticky top-0 z-10 flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide category-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 active:scale-95',
              activeCategory === cat
                ? 'bg-white text-ocean-950 shadow-[0_4px_16px_rgba(255,255,255,0.2)]'
                : 'bg-white/[0.07] text-white/50 border border-white/[0.06]',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Items list ────────────────────────────────── */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-36">
        {(restaurant.menu[activeCategory] ?? []).map((item) => {
          const qty = getQty(item.id);
          return (
            <div key={item.id} className="scroll-reveal-fast">
              <div className={[
                'flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 backdrop-blur-md',
                item.special
                  ? 'special-item'
                  : qty > 0
                  ? 'bg-ocean-600/[0.08] border border-ocean-600/[0.25] shadow-[0_0_20px_rgba(0,180,216,0.1)]'
                  : 'bg-white/[0.05] border border-white/[0.07]',
              ].join(' ')}>
                {/* Emoji tile */}
                <div className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${item.special ? 'bg-amber-400/[0.15] border border-amber-400/[0.3]' : 'bg-white/[0.08] border border-white/[0.08]'}`}>
                  {item.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {item.special && (
                    <span className="special-badge mb-1.5 inline-block">⭐ სპეციალური</span>
                  )}
                  <p className={`font-bold text-base leading-tight ${item.special ? 'text-amber-100' : 'text-white'}`}>{item.name}</p>
                  {item.description && (
                    <p className="text-white/35 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <p className={`font-black text-base mt-1.5 ${item.special ? 'text-amber-400' : 'text-sky-300'}`}>{formatPrice(item.price)}</p>
                </div>

                {/* Qty controls */}
                {qty === 0 ? (
                  <button
                    onClick={() => onAdd(item)}
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl text-white font-black active:scale-90 transition-transform ${item.special ? 'bg-amber-500 shadow-[0_4px_16px_rgba(245,158,11,0.5)]' : 'bg-btn-ocean shadow-ocean'}`}
                  >
                    +
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-bold active:scale-90 transition-transform bg-white/[0.12] border border-white/[0.1]"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-black text-white text-lg">{qty}</span>
                    <button
                      onClick={() => onAdd(item)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-lg active:scale-90 transition-transform ${item.special ? 'bg-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.5)]' : 'bg-btn-ocean shadow-ocean'}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky cart CTA ─────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-10 bg-gradient-to-t from-ocean-950 via-ocean-950/80 to-transparent">
          <button
            onClick={onOpenCart}
            className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-between px-5 active:scale-[0.98] transition-transform bg-btn-sand shadow-sand"
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-black/25">
              {cartCount}
            </span>
            <span>{t('view_cart')}</span>
            <span className="font-black">{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
