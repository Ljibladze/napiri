'use client';

import { useState, useEffect, useCallback } from 'react';
import { playNewOrder } from '@/lib/sounds';
import type { Order, OrderStatus } from '@/types';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { WaveBackground } from '@/components/layout/WaveBackground';
import { OrderCard } from '@/components/admin/OrderCard';
import { STATUS_LABEL } from '@/lib/utils';

const ADMIN_PASSWORD = 'napiri2024';

type FilterTab = 'all' | OrderStatus;

const FILTER_TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all',        label: 'ყველა',              emoji: '📋' },
  { key: 'pending',    label: STATUS_LABEL.pending,   emoji: '🕐' },
  { key: 'confirmed',  label: STATUS_LABEL.confirmed, emoji: '✅' },
  { key: 'preparing',  label: STATUS_LABEL.preparing, emoji: '👨‍🍳' },
  { key: 'delivering', label: STATUS_LABEL.delivering,emoji: '🏃' },
  { key: 'delivered',  label: STATUS_LABEL.delivered, emoji: '🎉' },
];

export default function AdminPage() {
  const [authed,    setAuthed]    = useState(false);
  const [password,  setPassword]  = useState('');
  const [authError, setAuthError] = useState(false);
  const [focused,   setFocused]   = useState(false);

  const [orders,       setOrders]       = useState<Order[]>([]);
  const [newOrderIds,  setNewOrderIds]  = useState<Set<string>>(new Set());
  const [filter,       setFilter]       = useState<FilterTab>('all');
  const [loading,      setLoading]      = useState(true);
  const [connected,    setConnected]    = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('napiri_admin') === ADMIN_PASSWORD) setAuthed(true);
    }
  }, []);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('napiri_admin', password);
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('napiri_admin');
    setAuthed(false);
    setOrders([]);
    setLoading(true);
  }

  useEffect(() => {
    if (!authed) return;
    api.orders.list().then(setOrders).catch(console.error).finally(() => setLoading(false));
  }, [authed]);

  useSocket({
    connect: () => {
      setConnected(true);
      if (authed) api.orders.list().then(setOrders).catch(console.error);
    },
    disconnect: () => setConnected(false),
    'new-order': (data: unknown) => {
      const order = data as Order;
      setOrders((prev) => [order, ...prev]);
      setNewOrderIds((prev) => new Set([...prev, order.id]));
      setTimeout(() => {
        setNewOrderIds((prev) => { const n = new Set(prev); n.delete(order.id); return n; });
      }, 8000);
      playNewOrder();
    },
    'order-updated': (data: unknown) => {
      const updated = data as Order;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    },
  });

  const handleStatusChange = useCallback(async (id: string, status: OrderStatus) => {
    try { await api.orders.updateStatus(id, status); } catch (err) { console.error(err); }
  }, []);

  const filtered       = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const pendingCount   = orders.filter((o) => o.status === 'pending').length;
  const activeCount    = orders.filter((o) => ['confirmed','preparing','delivering'].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <main className="relative min-h-dvh flex items-center justify-center px-5">
        <WaveBackground />
        <div className="relative z-10 w-full max-w-xs animate-fade-in">

          {/* Brand */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full bg-ocean-600/30 blur-3xl scale-[2.2]" />
              <span className="text-7xl leading-none animate-emoji relative z-10">🌊</span>
            </div>
            <h1 className="text-5xl font-black leading-none gradient-text">ნაპირი</h1>
            <p className="text-white/35 text-xs font-semibold tracking-[0.25em] uppercase mt-2">Admin Panel</p>
          </div>

          {/* Login card */}
          <div className="admin-card rounded-3xl p-6 space-y-4">
            <p className="text-white/50 text-sm text-center">შეიყვანეთ ადმინის პაროლი</p>

            <div className={[
              'relative rounded-2xl transition-all duration-300 overflow-hidden bg-white/[0.05]',
              focused
                ? 'border-2 border-ocean-600/[0.7] shadow-[0_0_0_4px_rgba(0,180,216,0.12)]'
                : authError
                ? 'border-2 border-red-500/50'
                : 'border-2 border-white/[0.08]',
            ].join(' ')}>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="• • • • • • • •"
                className="w-full bg-transparent px-5 py-4 text-white placeholder-white/20 text-center text-xl tracking-widest focus:outline-none"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs text-center animate-fade-in font-medium">❌ არასწორი პაროლი</p>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.97] bg-btn-sand shadow-sand"
            >
              შესვლა
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-dvh flex flex-col">
      <WaveBackground />

      {/* ── Header ──────────────────────────────────────── */}
      <header className="relative z-20 px-4 pt-4 pb-3 sticky top-0 header-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌊</span>
            <div>
              <h1 className="font-black text-xl leading-tight gradient-text">ნაპირი</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={[
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  connected ? 'bg-green-400 dot-live' : 'bg-red-400',
                ].join(' ')} />
                <span className="text-white/35 text-[11px] font-medium">
                  {connected ? 'Live · ქობულეთი' : 'კავშირი ეწყვეტა...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="text-xs font-black px-3 py-1.5 rounded-full text-white animate-pulse bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_4px_16px_rgba(245,158,11,0.5)]">
                {pendingCount} ახალი 🔔
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-white/30 hover:text-white/60 text-sm transition-colors px-3 py-1.5 rounded-xl font-medium bg-white/[0.05]"
            >
              გამოსვლა
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-5 pb-3 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-pending rounded-2xl p-3.5 text-center">
            <div className="text-xl mb-1">🕐</div>
            <div className="text-3xl font-black text-amber-300">{pendingCount}</div>
            <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">მოლოდინი</div>
          </div>
          <div className="stat-active rounded-2xl p-3.5 text-center">
            <div className="text-xl mb-1">⚡</div>
            <div className="text-3xl font-black text-blue-300">{activeCount}</div>
            <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">აქტიური</div>
          </div>
          <div className="stat-done rounded-2xl p-3.5 text-center">
            <div className="text-xl mb-1">✅</div>
            <div className="text-3xl font-black text-emerald-300">{deliveredCount}</div>
            <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">ჩაბარდა</div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────── */}
      <div className="relative z-10 px-4 pb-4 max-w-4xl mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === 'all' ? orders.length : orders.filter((o) => o.status === tab.key).length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={[
                  'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95',
                  active
                    ? 'bg-white/[0.14] border border-white/20 text-white backdrop-blur-md'
                    : 'bg-white/[0.04] border border-transparent text-white/40',
                ].join(' ')}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[18px] text-center ${active ? 'bg-white/20' : 'bg-white/[0.08]'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Order list ───────────────────────────────────── */}
      <div className="relative z-10 flex-1 px-4 pb-10 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {(['[animation-delay:0.12s]', '[animation-delay:0.24s]', '[animation-delay:0.36s]'] as const).map((delay, i) => (
              <div
                key={i}
                className={`rounded-3xl h-44 shimmer surface ${delay}`}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-5 animate-fade-in">
            <div className="text-7xl animate-float">🏖️</div>
            <div>
              <p className="text-white/30 font-bold text-lg">
                {filter === 'all' ? 'შეკვეთები ჯერ არ შემოსულა' : 'ამ სტატუსის შეკვეთები არ არის'}
              </p>
              <p className="text-white/15 text-sm mt-1">
                {filter === 'all' ? 'QR სკანირებების მოლოდინში...' : 'ფილტრი შეცვალეთ'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                isNew={newOrderIds.has(order.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
