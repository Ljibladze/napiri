'use client';

import { useState, useEffect } from 'react';
import { api, saveSession, clearSession, getUser, getToken } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { playNewOrder } from '@/lib/sounds';
import { WaveBackground } from '@/components/layout/WaveBackground';
import { formatPrice, STATUS_LABEL, STATUS_COLOR, STATUS_DOT, PAYMENT_ICON } from '@/lib/utils';
import type { Order } from '@/types';

const ACTIVE = ['pending', 'confirmed', 'preparing', 'delivering'] as const;

type CourierTab = 'live' | 'history';

function useElapsed(createdAt: string) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    function update() {
      const s = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (s < 60) setElapsed(`${s} წმ`);
      else if (s < 3600) setElapsed(`${Math.floor(s / 60)} წთ ${s % 60} წმ`);
      else setElapsed(`${Math.floor(s / 3600)} სთ ${Math.floor((s % 3600) / 60)} წთ`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  return elapsed;
}

function OrderRow({ order, isNew, onDeliver }: { order: Order; isNew: boolean; onDeliver?: (id: string) => Promise<void> }) {
  const elapsed = useElapsed(order.createdAt);
  const isActive = ACTIVE.includes(order.status as any);
  const [delivering, setDelivering] = useState(false);

  async function handleDeliver() {
    if (!onDeliver) return;
    setDelivering(true);
    try { await onDeliver(order.id); } finally { setDelivering(false); }
  }

  return (
    <div className={[
      'rounded-2xl overflow-hidden transition-all duration-500 bg-white/[0.05] backdrop-blur-xl border',
      isNew ? 'border-ocean-500/50 shadow-[0_0_32px_rgba(0,180,216,0.25)] animate-pop-in' : 'border-white/[0.08]',
    ].join(' ')}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-ocean-600/20 border border-ocean-500/30 flex flex-col items-center justify-center">
          <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none">შეზ</span>
          <span className="text-white font-black text-2xl leading-tight">#{order.loungeId}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLOR[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status]} ${order.status === 'pending' ? 'animate-pulse' : ''}`} />
            {STATUS_LABEL[order.status]}
          </span>
          <p className="text-white font-bold text-base mt-1 flex items-center gap-1.5">
            <span>{order.restaurantEmoji}</span>
            <span className="truncate">{order.restaurantName}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-black text-sm tabular-nums ${isActive ? 'text-sky-300' : 'text-white/30'}`}>{elapsed}</p>
          <p className="text-white/25 text-[10px] mt-0.5">{PAYMENT_ICON[order.paymentMethod]}</p>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-1.5 border-t border-white/[0.05] pt-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-white/65">
              <span>{item.emoji}</span>
              <span className={item.special ? 'text-amber-300 font-bold' : ''}>{item.name}</span>
              <span className="text-white/30 text-xs">×{item.quantity}</span>
            </span>
            <span className="text-white/50 text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        {order.notes && (
          <p className="text-xs text-amber-300/70 bg-amber-400/[0.07] border border-amber-400/15 rounded-lg px-3 py-2 mt-1">
            📝 {order.notes}
          </p>
        )}
      </div>

      <div className="px-4 py-2.5 bg-black/20 flex items-center justify-between gap-3 border-t border-white/[0.05]">
        <div>
          <span className="text-white/35 text-xs">სულ </span>
          <span className="text-white font-black text-lg">{formatPrice(order.total)}</span>
        </div>
        {order.status === 'delivering' && onDeliver && (
          <button onClick={handleDeliver} disabled={delivering}
            className="px-4 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5 bg-emerald-600/80 border border-emerald-500/40 shadow-[0_0_16px_rgba(52,211,153,0.2)]">
            {delivering ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : '✓ ჩავბარე'}
          </button>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  async function handleLogin() {
    if (!user || !pass) return;
    setLoading(true);
    setError(false);
    try {
      const res = await api.auth.login(user, pass);
      if (res.user.role !== 'courier' && res.user.role !== 'superAdmin') {
        setError(true);
        return;
      }
      saveSession(res.token, res.user);
      sessionStorage.setItem('napiri_courier', '1');
      onLogin();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-5">
      <div className="w-full max-w-sm admin-card rounded-3xl p-7 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">🏍️</div>
          <h1 className="text-white font-black text-2xl">კურიერი</h1>
          <p className="text-white/40 text-sm">ნაპირი · ქობულეთი</p>
        </div>
        <div className="space-y-3">
          <input type="text" placeholder="მომხმარებელი" value={user}
            onChange={(e) => { setUser(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            onFocus={() => setUserFocused(true)} onBlur={() => setUserFocused(false)}
            className={`w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none transition-all bg-white/[0.07] ${userFocused ? 'ring-2 ring-ocean-500/50 border border-ocean-500/30' : 'border border-white/[0.10]'}`} />
          <input type="password" placeholder="პაროლი" value={pass}
            onChange={(e) => { setPass(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            onFocus={() => setPassFocused(true)} onBlur={() => setPassFocused(false)}
            className={`w-full rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none transition-all bg-white/[0.07] ${passFocused ? 'ring-2 ring-ocean-500/50 border border-ocean-500/30' : 'border border-white/[0.10]'}`} />
        </div>
        {error && <p className="text-red-400 text-sm text-center">არასწორი მომხმარებელი ან პაროლი</p>}
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-white text-base bg-btn-ocean shadow-ocean active:scale-[0.97] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'შესვლა'}
        </button>
      </div>
    </div>
  );
}

export default function CourierPage() {
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CourierTab>('live');
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (token && user && sessionStorage.getItem('napiri_courier') === '1') {
      setCurrentUser(user);
      setIsActive(user.isActive ?? false);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    api.orders.assigned()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authed]);

  useEffect(() => {
    if (!authed || tab !== 'history' || !currentUser) return;
    setHistoryLoading(true);
    api.orders.byCourier(currentUser.id)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [authed, tab, currentUser]);

  async function toggleActive() {
    setTogglingActive(true);
    try {
      const updated = await api.users.setActive(!isActive);
      setIsActive(updated.isActive);
      const user = getUser();
      if (user) saveSession(getToken()!, { ...user, isActive: updated.isActive });
    } catch (e: any) { alert(e.message); }
    finally { setTogglingActive(false); }
  }

  useSocket({
    connect: () => {
      setConnected(true);
      if (authed) {
        api.orders.assigned().then(setOrders).catch(console.error);
      }
    },
    disconnect: () => setConnected(false),
    'new-order': (data: unknown) => {
      if (!authed || !currentUser) return;
      const order = data as Order;
      if (order.assignedCourierId !== currentUser.id) return;
      if (!ACTIVE.includes(order.status as any)) return;
      setOrders((prev) => [order, ...prev]);
      setNewIds((prev) => new Set([...prev, order.id]));
      setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(order.id); return n; }), 8000);
      playNewOrder();
    },
    'order-updated': (data: unknown) => {
      if (!authed) return;
      const updated = data as Order;
      setOrders((prev) => {
        const without = prev.filter((o) => o.id !== updated.id);
        return ACTIVE.includes(updated.status as any) ? [updated, ...without] : without;
      });
    },
  });

  function handleLogout() {
    clearSession();
    setAuthed(false);
    setCurrentUser(null);
  }

  if (!authed) {
    return (
      <main className="relative min-h-dvh">
        <WaveBackground />
        <div className="relative z-10">
          <LoginScreen onLogin={() => {
            setCurrentUser(getUser());
            setAuthed(true);
          }} />
        </div>
      </main>
    );
  }

  const active = orders.filter((o) => ACTIVE.includes(o.status as any));
  const deliveredCount = history.length;
  const totalRevenue = history.reduce((s, o) => s + o.total, 0);

  return (
    <main className="relative min-h-dvh">
      <WaveBackground />

      <header className="relative z-20 px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 header-blur">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏍️</span>
          <div>
            <span className="font-black text-xl tracking-tight text-white">კურიერი</span>
            <p className="text-white/40 text-xs">{currentUser?.username} · ქობულეთი</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleActive} disabled={togglingActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 disabled:opacity-60 ${isActive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.07] border-white/[0.10] text-white/40'}`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`} />
            {togglingActive ? '...' : isActive ? 'ვმუშაობ' : 'შესვენება'}
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/[0.08]">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 dot-live' : 'bg-white/20'}`} />
            <span className="text-white/40 text-[10px] font-bold">{connected ? 'LIVE' : '...'}</span>
          </div>
          <button onClick={handleLogout}
            className="text-white/30 hover:text-white/60 text-xs transition-colors px-2.5 py-1.5 rounded-xl bg-white/[0.05]">
            გამოსვლა
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="relative z-10 px-4 pb-2 pt-1 flex gap-2">
        <button onClick={() => setTab('live')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'live' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          ⚡ Live
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'history' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          📊 სტატისტიკა
        </button>
      </div>

      <div className="relative z-10 px-4 pb-8 space-y-3 pt-2">
        {tab === 'live' ? (
          <>
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4 h-64 text-white/40">
                <div className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
                <span className="text-sm">იტვირთება...</span>
              </div>
            )}
            {!loading && active.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 h-64 text-white/30">
                <span className="text-5xl">🏖️</span>
                <p className="text-sm font-medium">აქტიური შეკვეთა არ არის</p>
              </div>
            )}
            {active.map((order) => (
              <OrderRow key={order.id} order={order} isNew={newIds.has(order.id)}
                onDeliver={async (id) => {
                  await api.orders.updateStatus(id, 'delivered', currentUser?.id);
                }} />
            ))}
          </>
        ) : (
          <>
            {historyLoading ? (
              <div className="flex justify-center py-16">
                <span className="w-8 h-8 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 text-center">
                    <div className="text-2xl mb-1">📦</div>
                    <div className="text-2xl font-black text-sky-300">{deliveredCount}</div>
                    <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">ჩაბარება</div>
                  </div>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 text-center">
                    <div className="text-2xl mb-1">💰</div>
                    <div className="text-2xl font-black text-emerald-300">₾{totalRevenue.toFixed(0)}</div>
                    <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">ღირებულება</div>
                  </div>
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-sm">
                    <span className="text-4xl block mb-3">🏖️</span>
                    ჩაბარებული შეკვეთა ჯერ არ გაქვს
                  </div>
                ) : (
                  history.map((order) => (
                    <OrderRow key={order.id} order={order} isNew={false} />
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
