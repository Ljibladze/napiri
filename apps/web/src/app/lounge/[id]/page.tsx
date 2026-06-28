'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { RestaurantSummary, RestaurantDetail, Order, PaymentMethod } from '@/types';
import { api } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useLang } from '@/contexts/LanguageContext';
import { useSocket } from '@/hooks/useSocket';
import { WaveBackground } from '@/components/layout/WaveBackground';
import { RestaurantGrid } from '@/components/lounge/RestaurantGrid';
import { MenuView } from '@/components/lounge/MenuView';
import { CartSheet } from '@/components/lounge/CartSheet';
import { OrderSuccess } from '@/components/lounge/OrderSuccess';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { formatPrice, STATUS_LABEL } from '@/lib/utils';

type View = 'restaurants' | 'menu' | 'success';

const DONE_STATUSES = ['delivered', 'cancelled'] as const;

export default function LoungePage() {
  const params = useParams();
  const loungeId = params.id as string;
  const { t } = useLang();

  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDetail | null>(null);
  const [view, setView] = useState<View>('restaurants');
  const [showCart, setShowCart] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cart = useCart();
  const orderKey = `napiri_order_${loungeId}`;

  useEffect(() => {
    api.restaurants
      .list()
      .then(setRestaurants)
      .catch(() => setError(t('error_connect')))
      .finally(() => setLoadingRestaurants(false));

    const saved = localStorage.getItem(orderKey);
    if (saved) {
      try {
        const { id, ts } = JSON.parse(saved);
        if (Date.now() - ts > 12 * 60 * 60 * 1000) {
          localStorage.removeItem(orderKey);
        } else {
          api.orders.get(id)
            .then((order) => {
              if (DONE_STATUSES.includes(order.status as any)) {
                localStorage.removeItem(orderKey);
              } else {
                setPlacedOrder(order);
                setView('success');
              }
            })
            .catch(() => localStorage.removeItem(orderKey));
        }
      } catch { localStorage.removeItem(orderKey); }
    }
  }, []);

  useSocket({
    'order-updated': (data: unknown) => {
      const updated = data as Order;
      if (!placedOrder || updated.id !== placedOrder.id) return;
      if (DONE_STATUSES.includes(updated.status as any)) {
        setPlacedOrder(updated);
        localStorage.removeItem(orderKey);
      } else {
        setPlacedOrder(updated);
      }
    },
  });

  const handleSelectRestaurant = useCallback(
    async (summary: RestaurantSummary) => {
      if (cart.hasItems && cart.restaurantId && cart.restaurantId !== summary.id) {
        const confirmed = window.confirm(
          `კალათაში გაქვთ ${selectedRestaurant?.name}-ის პროდუქტები. სხვა რესტორნის არჩევა გასუფთავებს კალათას. გაგრძელება?`,
        );
        if (!confirmed) return;
        cart.clearCart();
      }
      setLoadingMenu(true);
      try {
        const detail = await api.restaurants.get(summary.id);
        setSelectedRestaurant(detail);
        setView('menu');
      } catch {
        setError('მენიუ ვერ ჩაიტვირთა.');
      } finally {
        setLoadingMenu(false);
      }
    },
    [cart, selectedRestaurant],
  );

  async function handleSubmitOrder(paymentMethod: PaymentMethod, notes: string) {
    if (!selectedRestaurant) return;
    const order = await api.orders.create({
      loungeId,
      restaurantId: selectedRestaurant.id,
      items: cart.items,
      paymentMethod,
      notes: notes || undefined,
    });
    cart.clearCart();
    setShowCart(false);
    setPlacedOrder(order);
    setView('success');
    localStorage.setItem(orderKey, JSON.stringify({ id: order.id, ts: Date.now() }));
  }

  function handleNewOrder() {
    setView('restaurants');
  }

  const showOrderBubble =
    placedOrder !== null &&
    !DONE_STATUSES.includes(placedOrder.status as any) &&
    view !== 'success';

  return (
    <main className="relative flex flex-col min-h-dvh">
      <WaveBackground />

      {/* ── Sticky header ───────────────────────────── */}
      <header className="relative z-20 px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 header-blur">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">🌊</span>
          <div>
            <span className="font-black text-xl tracking-tight leading-none">
              <span className="text-white">ნა</span>
              <span className="text-ocean-400">პირი</span>
            </span>
            {view !== 'success' && (
              <p className="text-white/40 text-xs leading-tight">
                {t('lounge_label')} #{loungeId} · ქობულეთი
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cart.hasItems && view !== 'success' && (
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold bg-btn-sand shadow-sand-sm active:scale-95 transition-all"
            >
              <span>🛒</span>
              <span>{formatPrice(cart.totalPrice)}</span>
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center bg-ocean-400 text-ocean-950">
                {cart.totalItems}
              </span>
            </button>
          )}
          <LanguageSelector />
        </div>
      </header>

      {/* ── Content ─────────────────────────────────── */}
      <div className="relative z-10 flex-1">
        {error && (
          <div className="mx-4 mt-4 bg-red-500/[0.15] border border-red-500/[0.25] rounded-2xl p-4 text-red-200 text-sm text-center">
            {error}
            <button
              onClick={() => { setError(null); window.location.reload(); }}
              className="block mt-2 underline text-red-300 font-medium"
            >
              {t('reload')}
            </button>
          </div>
        )}

        {loadingRestaurants && view === 'restaurants' && (
          <div className="flex flex-col items-center justify-center gap-4 h-64 text-white/40">
            <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            <span className="text-sm">{t('loading')}</span>
          </div>
        )}

        {!loadingRestaurants && view === 'restaurants' && (
          <div className="animate-fade-in">
            <div className="px-5 pt-6 pb-4">
              <p className="text-white/50 text-sm font-medium">{t('hello')}</p>
              <h1 className="text-2xl font-black text-white mt-0.5">{t('what_today')}</h1>
              <p className="text-white/40 text-sm mt-1">{t('will_deliver')}</p>
            </div>

            {loadingMenu && (
              <div className="flex items-center justify-center gap-2 py-3 text-white/40 text-sm mx-5">
                <div className="w-4 h-4 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                {t('menu_loading')}
              </div>
            )}

            <div className="px-4 pb-8">
              <RestaurantGrid
                restaurants={restaurants}
                onSelect={handleSelectRestaurant}
                activeRestaurantId={cart.restaurantId}
              />
            </div>
          </div>
        )}

        {view === 'menu' && selectedRestaurant && (
          <MenuView
            restaurant={selectedRestaurant}
            cartItems={cart.items}
            onAdd={(item) => cart.addItem(item, selectedRestaurant.id)}
            onRemove={(id) => cart.updateQuantity(id, (cart.items.find(i => i.id === id)?.quantity ?? 1) - 1)}
            onBack={() => setView('restaurants')}
            onOpenCart={() => setShowCart(true)}
            cartTotal={cart.totalPrice}
            cartCount={cart.totalItems}
          />
        )}

        {view === 'success' && placedOrder && (
          <OrderSuccess order={placedOrder} onNewOrder={handleNewOrder} />
        )}
      </div>

      {/* ── Active order floating bubble ─────────────── */}
      {showOrderBubble && (
        <button
          onClick={() => setView('success')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(0,180,216,0.35)] animate-fade-in bg-ocean-600/90 backdrop-blur-xl border border-ocean-400/30 active:scale-95 transition-all"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-300" />
          </span>
          <span className="text-white font-bold text-sm">
            შეკვეთა · {STATUS_LABEL[placedOrder.status]}
          </span>
          <span className="text-sky-200 text-xs">›</span>
        </button>
      )}

      {showCart && cart.hasItems && selectedRestaurant && (
        <CartSheet
          items={cart.items}
          restaurantName={selectedRestaurant.name}
          restaurantEmoji={selectedRestaurant.emoji}
          loungeId={loungeId}
          onUpdateQuantity={cart.updateQuantity}
          onClose={() => setShowCart(false)}
          onSubmit={handleSubmitOrder}
        />
      )}
    </main>
  );
}
