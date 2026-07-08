'use client';

import { useState, useEffect, useCallback } from 'react';
import { playNewOrder } from '@/lib/sounds';
import type { Order, OrderStatus } from '@/types';
import { api, saveSession, clearSession, getUser, getToken } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { WaveBackground } from '@/components/layout/WaveBackground';
import { OrderCard } from '@/components/admin/OrderCard';
import { STATUS_LABEL } from '@/lib/utils';

type FilterTab = 'all' | OrderStatus;
type AdminTab = 'orders' | 'couriers' | 'stats';

const FILTER_TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all',        label: 'ყველა',              emoji: '📋' },
  { key: 'pending',    label: STATUS_LABEL.pending,   emoji: '🕐' },
  { key: 'confirmed',  label: STATUS_LABEL.confirmed, emoji: '✅' },
  { key: 'preparing',  label: STATUS_LABEL.preparing, emoji: '👨‍🍳' },
  { key: 'delivering', label: STATUS_LABEL.delivering,emoji: '🏃' },
  { key: 'delivered',  label: STATUS_LABEL.delivered, emoji: '🎉' },
];

// ── Couriers Tab ──────────────────────────────────────────────────────────────

function CouriersTab({ user }: { user: any }) {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    api.users.list().then(setCouriers).catch(console.error).finally(() => setLoading(false));
    const rId = user.role === 'restaurantAdmin' ? user.restaurantId : undefined;
    api.orders.courierStats(rId).then(setStats).catch(console.error);
  }, []);

  function getStats(courierId: string) {
    return stats.find((s) => s.courierId === courierId);
  }

  async function handleCreate() {
    if (!form.username || !form.password) return;
    setSaving(true);
    try {
      const created = await api.users.create({ username: form.username, password: form.password, role: 'courier' });
      setCouriers((p) => [created, ...p]);
      setModal(false);
      setForm({ username: '', password: '' });
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('წაიშალოს?')) return;
    setDeletingId(id);
    try {
      await api.users.remove(id);
      setCouriers((p) => p.filter((c) => c.id !== id));
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">კურიერები</h3>
        <button onClick={() => setModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-ocean-600/70 border border-ocean-500/40 text-white active:scale-95 transition-all">
          + კურიერის დამატება
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" />
        </div>
      ) : couriers.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">კურიერი არ დარეგისტრირებულა</div>
      ) : (
        <div className="space-y-3">
          {couriers.map((c) => {
            const s = getStats(c.id);
            return (
              <div key={c.id} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ocean-600/20 border border-ocean-500/30 flex items-center justify-center text-xl">🏍️</div>
                    <div>
                      <p className="text-white font-bold">{c.username}</p>
                      <p className="text-white/35 text-xs mt-0.5">
                        {s ? `${s.deliveries} ჩაბარება · ₾${s.revenue.toFixed(0)}` : 'ჩაბარება: 0'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600/30 border border-red-500/20 text-red-300 active:scale-95 transition-all disabled:opacity-50">
                    {deletingId === c.id ? '...' : '🗑️'}
                  </button>
                </div>

                {s?.byRestaurant?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex flex-wrap gap-2">
                    {s.byRestaurant.map((r: any) => (
                      <span key={r.id} className="text-xs bg-white/[0.06] border border-white/[0.08] rounded-lg px-2.5 py-1 text-white/60">
                        {r.emoji} {r.name}: <span className="text-sky-300 font-bold">{r.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d1b2a] border border-white/[0.12] rounded-3xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-lg">+ კურიერის დამატება</h3>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white text-xl transition-colors">✕</button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">მომხმარებელი</label>
                <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all"
                  placeholder="courier2" />
              </div>
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">პაროლი</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all"
                  placeholder="••••••••" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/[0.06] border border-white/[0.10] text-white/70 active:scale-95 transition-all">
                გაუქმება
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-ocean-600/70 border border-ocean-500/40 text-white active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

const STATUS_GE: Record<string, string> = {
  pending: 'მოლოდინი', confirmed: 'დადასტურდა', preparing: 'მზადდება',
  delivering: 'გზაშია', delivered: 'ჩაბარდა', cancelled: 'გაუქმდა',
};

function StatsTab({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rId = user.role === 'restaurantAdmin' ? user.restaurantId : undefined;
    api.stats.get().then((data) => {
      if (rId) {
        const rStat = data.byRestaurant?.find((r: any) => r.id === rId);
        const rOrders = data.recent?.filter((o: any) => o.restaurantId === rId) ?? [];
        const byStatus = rOrders.reduce<Record<string, number>>((acc: Record<string, number>, o: any) => {
          acc[o.status] = (acc[o.status] ?? 0) + 1;
          return acc;
        }, {});
        setStats({
          totalOrders: rStat?.orders ?? 0,
          totalRevenue: rStat?.revenue ?? 0,
          byStatus,
          byCourier: data.byCourier?.filter((c: any) => c.restaurantId === rId || c.byRestaurant?.some((r: any) => r.id === rId)) ?? [],
        });
      } else {
        setStats(data);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex justify-center py-16"><span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-2xl font-black text-sky-300">{stats.totalOrders}</div>
          <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">სულ შეკვეთა</div>
        </div>
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-2xl font-black text-emerald-300">₾{(stats.totalRevenue ?? 0).toFixed(0)}</div>
          <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">შემოსავალი</div>
        </div>
      </div>

      {stats.byStatus && Object.keys(stats.byStatus).length > 0 && (
        <div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">სტატუსი</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(stats.byStatus as Record<string, number>).map(([st, cnt]) => (
              <div key={st} className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-2.5 text-center">
                <div className="text-white font-black text-lg">{cnt}</div>
                <div className="text-white/35 text-[10px]">{STATUS_GE[st] ?? st}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.byCourier?.length > 0 && (
        <div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">კურიერები</p>
          <div className="space-y-2">
            {stats.byCourier.map((c: any) => {
              const myCount = c.byRestaurant?.find((r: any) => r.id === user.restaurantId)?.count ?? c.deliveries;
              return (
                <div key={c.courierId} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3">
                  <span className="text-xl">🏍️</span>
                  <span className="text-white font-bold flex-1">{c.username}</span>
                  <span className="text-sky-300 font-black">{myCount}</span>
                  <span className="text-white/30 text-xs">ჩაბარება</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [focused, setFocused] = useState<'user' | 'pass' | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState<AdminTab>('orders');

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (token && user && (user.role === 'restaurantAdmin' || user.role === 'superAdmin')) {
      setCurrentUser(user);
      setAuthed(true);
    }
  }, []);

  async function handleLogin() {
    if (!username || !password) return;
    setAuthLoading(true);
    setAuthError(false);
    try {
      const res = await api.auth.login(username, password);
      if (res.user.role !== 'restaurantAdmin' && res.user.role !== 'superAdmin') {
        setAuthError(true);
        return;
      }
      saveSession(res.token, res.user);
      setCurrentUser(res.user);
      setAuthed(true);
    } catch {
      setAuthError(true);
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    setAuthed(false);
    setCurrentUser(null);
    setOrders([]);
    setLoading(true);
  }

  const loadOrders = useCallback(async () => {
    if (!currentUser) return;
    const rId = currentUser.role === 'restaurantAdmin' ? currentUser.restaurantId : undefined;
    const data = await api.orders.list(rId);
    setOrders(data);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (authed && currentUser) loadOrders();
  }, [authed, currentUser]);

  useSocket({
    connect: () => {
      setConnected(true);
      if (authed && currentUser) loadOrders();
    },
    disconnect: () => setConnected(false),
    'new-order': (data: unknown) => {
      const order = data as Order;
      if (currentUser?.role === 'restaurantAdmin' && order.restaurantId !== currentUser.restaurantId) return;
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
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full bg-ocean-600/30 blur-3xl scale-[2.2]" />
              <span className="text-7xl leading-none animate-emoji relative z-10">🌊</span>
            </div>
            <h1 className="text-5xl font-black leading-none gradient-text">ნაპირი</h1>
            <p className="text-white/35 text-xs font-semibold tracking-[0.25em] uppercase mt-2">Admin Panel</p>
          </div>

          <div className="admin-card rounded-3xl p-6 space-y-3">
            <div className={`relative rounded-2xl transition-all duration-300 overflow-hidden bg-white/[0.05] ${focused === 'user' ? 'border-2 border-ocean-600/[0.7] shadow-[0_0_0_4px_rgba(0,180,216,0.12)]' : 'border-2 border-white/[0.08]'}`}>
              <input
                type="text" value={username} placeholder="მომხმარებელი"
                onChange={(e) => { setUsername(e.target.value); setAuthError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                onFocus={() => setFocused('user')} onBlur={() => setFocused(null)}
                className="w-full bg-transparent px-5 py-4 text-white placeholder-white/20 text-base focus:outline-none"
              />
            </div>
            <div className={`relative rounded-2xl transition-all duration-300 overflow-hidden bg-white/[0.05] ${focused === 'pass' ? 'border-2 border-ocean-600/[0.7] shadow-[0_0_0_4px_rgba(0,180,216,0.12)]' : authError ? 'border-2 border-red-500/50' : 'border-2 border-white/[0.08]'}`}>
              <input
                type="password" value={password} placeholder="• • • • • • • •"
                onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                className="w-full bg-transparent px-5 py-4 text-white placeholder-white/20 text-center text-xl tracking-widest focus:outline-none"
              />
            </div>

            {authError && <p className="text-red-400 text-xs text-center font-medium">❌ არასწორი მომხმარებელი ან პაროლი</p>}

            <button onClick={handleLogin} disabled={authLoading}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-[0.97] bg-btn-sand shadow-sand disabled:opacity-60 flex items-center justify-center gap-2">
              {authLoading ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'შესვლა'}
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

      <header className="relative z-20 px-4 pt-4 pb-3 sticky top-0 header-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌊</span>
            <div>
              <h1 className="font-black text-xl leading-tight gradient-text">ნაპირი</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 dot-live' : 'bg-red-400'}`} />
                <span className="text-white/35 text-[11px] font-medium">
                  {connected ? `Live · ${currentUser?.username}` : 'კავშირი ეწყვეტა...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingCount > 0 && tab === 'orders' && (
              <span className="text-xs font-black px-3 py-1.5 rounded-full text-white animate-pulse bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_4px_16px_rgba(245,158,11,0.5)]">
                {pendingCount} ახალი 🔔
              </span>
            )}
            <button onClick={handleLogout}
              className="text-white/30 hover:text-white/60 text-sm transition-colors px-3 py-1.5 rounded-xl font-medium bg-white/[0.05]">
              გამოსვლა
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-3 pb-1 max-w-4xl mx-auto w-full flex gap-2">
        <button onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'orders' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          📋 შეკვეთები
        </button>
        <button onClick={() => setTab('couriers')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'couriers' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          🏍️ კურიერები
        </button>
        <button onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'stats' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          📊 სტატ.
        </button>
      </div>

      {tab === 'couriers' ? (
        <div className="relative z-10 flex-1 px-4 pb-10 max-w-4xl mx-auto w-full pt-4">
          <CouriersTab user={currentUser} />
        </div>
      ) : tab === 'stats' ? (
        <div className="relative z-10 flex-1 px-4 pb-10 max-w-4xl mx-auto w-full pt-4">
          <StatsTab user={currentUser} />
        </div>
      ) : (
        <>
          {/* ── Stats ──────────────────────────────── */}
          <div className="relative z-10 px-4 pt-4 pb-3 max-w-4xl mx-auto w-full">
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

          {/* ── Filter tabs ──────────────────────────── */}
          <div className="relative z-10 px-4 pb-4 max-w-4xl mx-auto w-full">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {FILTER_TABS.map((t) => {
                const count = t.key === 'all' ? orders.length : orders.filter((o) => o.status === t.key).length;
                const active = filter === t.key;
                return (
                  <button key={t.key} onClick={() => setFilter(t.key)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${active ? 'bg-white/[0.14] border border-white/20 text-white' : 'bg-white/[0.04] border border-transparent text-white/40'}`}>
                    <span>{t.emoji}</span><span>{t.label}</span>
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

          {/* ── Order list ───────────────────────────── */}
          <div className="relative z-10 flex-1 px-4 pb-10 max-w-4xl mx-auto w-full">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="rounded-3xl h-44 shimmer surface" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 space-y-5 animate-fade-in">
                <div className="text-7xl animate-float">🏖️</div>
                <p className="text-white/30 font-bold text-lg">
                  {filter === 'all' ? 'შეკვეთები ჯერ არ შემოსულა' : 'ამ სტატუსის შეკვეთები არ არის'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} isNew={newOrderIds.has(order.id)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
