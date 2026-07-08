'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { WaveBackground } from '@/components/layout/WaveBackground';

type Tab = 'overview' | 'menu' | 'users' | 'stats';
type ModalType = 'addItem' | 'editItem' | 'addUser' | 'addRestaurant' | null;

const COVER_CLASSES = ['grad-olympos', 'grad-bluebay', 'grad-sanapiro'];
const ROLE_LABEL: Record<string, string> = {
  superAdmin: 'SuperAdmin',
  restaurantAdmin: 'რესტორანი',
  courier: 'კურიერი',
};
const ROLE_COLOR: Record<string, string> = {
  superAdmin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  restaurantAdmin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  courier: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

// ── Tiny reusable components ──────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string | number; color: string }) {
  return (
    <Card className="text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-white/35 text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</div>
    </Card>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0d1b2a] border border-white/[0.12] rounded-3xl p-6 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</label>
      <input
        {...props}
        className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/30 transition-all"
      />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</label>
      <select
        {...props}
        className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 focus:border-ocean-500/30 transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function Btn({ variant = 'primary', children, className = '', ...props }: { variant?: 'primary' | 'danger' | 'ghost' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-ocean-600/70 border border-ocean-500/40 text-white hover:bg-ocean-600/90',
    danger: 'bg-red-600/40 border border-red-500/30 text-red-300 hover:bg-red-600/60',
    ghost: 'bg-white/[0.06] border border-white/[0.10] text-white/70 hover:text-white',
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.login(username, password);
      if (res.user.role !== 'superAdmin') {
        setError('წვდომა აკრძალულია');
        return;
      }
      sessionStorage.setItem('napiri_jwt', res.token);
      sessionStorage.setItem('napiri_superadmin', JSON.stringify(res.user));
      onLogin(res.token, res.user);
    } catch {
      setError('არასწორი მომხმარებელი ან პაროლი');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-5">
      <div className="w-full max-w-sm admin-card rounded-3xl p-7 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-white font-black text-2xl">SuperAdmin</h1>
          <p className="text-white/40 text-sm">ნაპირი · ქობულეთი</p>
        </div>
        <div className="space-y-3">
          <Input label="მომხმარებელი" type="text" value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="superadmin" />
          <Input label="პაროლი" type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••" />
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-white text-base bg-btn-ocean shadow-ocean active:scale-[0.97] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'შესვლა'}
        </button>
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ stats }: { stats: any }) {
  if (!stats) return <div className="flex justify-center py-20 text-white/30 text-sm">იტვირთება...</div>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard emoji="📦" label="სულ შეკვეთა" value={stats.totalOrders} color="text-sky-300" />
        <StatCard emoji="💰" label="შემოსავალი" value={`₾${stats.totalRevenue.toFixed(0)}`} color="text-emerald-300" />
        <StatCard emoji="⏳" label="მოლოდინი" value={stats.byStatus?.pending ?? 0} color="text-amber-300" />
        <StatCard emoji="✅" label="ჩაბარდა" value={stats.byStatus?.delivered ?? 0} color="text-green-300" />
      </div>

      <div>
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">რესტორნები</h3>
        <div className="space-y-2">
          {stats.byRestaurant?.map((r: any) => (
            <Card key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2">
                <span>{r.emoji}</span>
                <span className="text-white font-semibold text-sm">{r.name}</span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-sky-300 font-black text-sm">{r.orders}</div>
                  <div className="text-white/30 text-[10px]">შეკ.</div>
                </div>
                <div>
                  <div className="text-emerald-300 font-black text-sm">₾{r.revenue.toFixed(0)}</div>
                  <div className="text-white/30 text-[10px]">შემ.</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Menu Tab ──────────────────────────────────────────────────────────────────

function MenuTab({ restaurants }: { restaurants: any[] }) {
  const [selectedR, setSelectedR] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modal, setModal] = useState<null | { type: 'add' | 'edit'; item?: any }>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', emoji: '🍽️', category: '', special: false });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async (r: any) => {
    setSelectedR(r);
    setLoadingItems(true);
    try {
      const data = await api.menu.list(r.id);
      setItems(data);
    } catch { } finally { setLoadingItems(false); }
  }, []);

  function openAdd() {
    setForm({ name: '', description: '', price: '', emoji: '🍽️', category: '', special: false });
    setModal({ type: 'add' });
  }

  function openEdit(item: any) {
    setForm({ name: item.name, description: item.description ?? '', price: String(item.price), emoji: item.emoji, category: item.category, special: item.special });
    setModal({ type: 'edit', item });
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.category || !selectedR) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        emoji: form.emoji,
        category: form.category,
        special: form.special,
        restaurantId: selectedR.id,
      };
      if (modal?.type === 'add') {
        const created = await api.menu.create(payload);
        setItems((prev) => [...prev, created]);
      } else if (modal?.item) {
        const updated = await api.menu.update(modal.item.id, payload);
        setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      }
      setModal(null);
    } catch (e: any) {
      alert(e.message ?? 'შეცდომა');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('წაიშალოს?')) return;
    setDeletingId(id);
    try {
      await api.menu.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setDeletingId(null); }
  }

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">აირჩიეთ რესტორანი</p>
        <div className="flex flex-wrap gap-2">
          {restaurants.map((r) => (
            <button key={r.id} onClick={() => loadItems(r)}
              className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 flex items-center gap-1.5 ${selectedR?.id === r.id ? 'bg-ocean-600/50 border-ocean-500/50 text-white' : 'bg-white/[0.05] border-white/[0.10] text-white/60'}`}>
              <span>{r.emoji}</span><span>{r.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedR && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black">{selectedR.emoji} {selectedR.name}</h3>
            <Btn onClick={openAdd}>+ დამატება</Btn>
          </div>

          {loadingItems && (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" />
            </div>
          )}

          {!loadingItems && items.length === 0 && (
            <div className="text-center py-10 text-white/30 text-sm">მენიუ ცარიელია</div>
          )}

          {!loadingItems && categories.map((cat) => (
            <div key={cat}>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-2">
                {items.filter((i) => i.category === cat).map((item) => (
                  <Card key={item.id} className="flex items-center gap-3 py-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${item.special ? 'text-amber-300' : 'text-white'}`}>
                        {item.name}
                        {item.special && <span className="ml-1.5 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/20 rounded-full px-1.5 py-0.5">სპეც</span>}
                      </p>
                      {item.description && <p className="text-white/35 text-xs truncate">{item.description}</p>}
                    </div>
                    <span className="text-emerald-300 font-black text-sm shrink-0">₾{item.price}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Btn variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => openEdit(item)}>✏️</Btn>
                      <Btn variant="danger" className="px-2.5 py-1.5 text-xs"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}>
                        {deletingId === item.id ? '...' : '🗑️'}
                      </Btn>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.type === 'add' ? '+ მენიუს დამატება' : '✏️ რედაქტირება'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="სახელი" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ბურგერი" />
            <Input label="აღწერა (არასავალდებულო)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="200გ საქონელი, ბეკონი..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="ფასი (₾)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="15" />
              <Input label="ემოჯი" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🍔" />
            </div>
            <Input label="კატეგორია" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="სენდვიჩები" />
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, special: !f.special }))}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.special ? 'bg-amber-500' : 'bg-white/20'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.special ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-white/70 text-sm">სპეციალური კერძი ⭐</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1" onClick={() => setModal(null)}>გაუქმება</Btn>
              <Btn className="flex-1" disabled={saving} onClick={handleSave}>
                {saving ? <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />...</span> : 'შენახვა'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ restaurants }: { restaurants: any[] }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'courier', restaurantId: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.users.list().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.username || !form.password) return;
    setSaving(true);
    try {
      const created = await api.users.create({
        username: form.username,
        password: form.password,
        role: form.role,
        restaurantId: form.restaurantId || undefined,
      });
      setUsers((prev) => [created, ...prev]);
      setModal(false);
      setForm({ username: '', password: '', role: 'courier', restaurantId: '' });
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('წაიშალოს?')) return;
    setDeletingId(id);
    try {
      await api.users.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">მომხმარებლები</h3>
        <Btn onClick={() => setModal(true)}>+ დამატება</Btn>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center text-lg shrink-0">
                {u.role === 'superAdmin' ? '⚡' : u.role === 'courier' ? '🏍️' : '🏪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{u.username}</p>
                {u.restaurantId && (
                  <p className="text-white/35 text-xs">{restaurants.find((r) => r.id === u.restaurantId)?.name ?? u.restaurantId}</p>
                )}
              </div>
              <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
              {u.role !== 'superAdmin' && (
                <Btn variant="danger" className="px-2.5 py-1.5 text-xs shrink-0"
                  disabled={deletingId === u.id}
                  onClick={() => handleDelete(u.id)}>
                  {deletingId === u.id ? '...' : '🗑️'}
                </Btn>
              )}
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="+ მომხმარებლის დამატება" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <Input label="მომხმარებლის სახელი" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="courier2" />
            <Input label="პაროლი" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            <Select label="როლი" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="courier">კურიერი</option>
              <option value="restaurantAdmin">რესტორნის ადმინი</option>
              <option value="superAdmin">SuperAdmin</option>
            </Select>
            {form.role === 'restaurantAdmin' && (
              <Select label="რესტორანი" value={form.restaurantId} onChange={(e) => setForm((f) => ({ ...f, restaurantId: e.target.value }))}>
                <option value="">-- აირჩიეთ --</option>
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
              </Select>
            )}
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1" onClick={() => setModal(false)}>გაუქმება</Btn>
              <Btn className="flex-1" disabled={saving} onClick={handleCreate}>
                {saving ? <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />...</span> : 'შენახვა'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

function StatsTab() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { setStats(await api.stats.get(from || undefined, to || undefined)); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const STATUS_GE: Record<string, string> = {
    pending: 'მოლოდინი', confirmed: 'დადასტურდა', preparing: 'მზადდება',
    delivering: 'გზაშია', delivered: 'ჩაბარდა', cancelled: 'გაუქმდა',
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-28">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">დან</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all" />
          </div>
          <div className="space-y-1 flex-1 min-w-28">
            <label className="text-white/40 text-xs font-semibold uppercase tracking-wider">მდე</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all" />
          </div>
          <Btn onClick={load} disabled={loading} className="shrink-0 px-5">
            {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : '🔍 ძებნა'}
          </Btn>
        </div>
      </Card>

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard emoji="📦" label="სულ შეკვეთა" value={stats.totalOrders} color="text-sky-300" />
            <StatCard emoji="💰" label="შემოსავალი" value={`₾${stats.totalRevenue.toFixed(2)}`} color="text-emerald-300" />
          </div>

          <div>
            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">სტატუსი</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(stats.byStatus as Record<string, number>).map(([st, cnt]) => (
                <Card key={st} className="text-center py-2">
                  <div className="text-white font-black text-lg">{cnt}</div>
                  <div className="text-white/35 text-[10px]">{STATUS_GE[st] ?? st}</div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">რესტორნები</h3>
            <div className="space-y-2">
              {stats.byRestaurant?.map((r: any) => (
                <Card key={r.id} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    <div className="w-full bg-white/[0.07] rounded-full h-1 mt-1.5">
                      <div className="bg-ocean-500 h-1 rounded-full transition-all"
                        style={{ width: stats.totalOrders ? `${(r.orders / stats.totalOrders) * 100}%` : '0%' }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sky-300 font-black text-sm">{r.orders} შეკ.</div>
                    <div className="text-emerald-300 font-bold text-xs">₾{r.revenue.toFixed(0)}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('napiri_superadmin');
    const token = sessionStorage.getItem('napiri_jwt');
    if (stored && token) setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    api.restaurants.listAdmin().then(setRestaurants).catch(console.error);
    api.stats.get().then(setStats).catch(console.error);
  }, [authed]);

  function handleLogin(_token: string, _user: any) {
    setAuthed(true);
  }

  function handleLogout() {
    sessionStorage.removeItem('napiri_jwt');
    sessionStorage.removeItem('napiri_superadmin');
    setAuthed(false);
  }

  const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key: 'overview', label: 'მიმოხილვა', emoji: '📊' },
    { key: 'menu',     label: 'მენიუ',     emoji: '🍽️' },
    { key: 'users',    label: 'იუზერები',  emoji: '👥' },
    { key: 'stats',    label: 'სტატ.',     emoji: '📈' },
  ];

  if (!authed) {
    return (
      <main className="relative min-h-dvh">
        <WaveBackground />
        <div className="relative z-10">
          <LoginScreen onLogin={handleLogin} />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh flex flex-col">
      <WaveBackground />

      <header className="relative z-20 px-4 pt-4 pb-3 sticky top-0 header-blur flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">⚡</span>
          <div>
            <span className="font-black text-xl text-white">SuperAdmin</span>
            <p className="text-white/40 text-xs">ნაპირი · ქობულეთი</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-sm transition-colors px-3 py-1.5 rounded-xl bg-white/[0.05]">
          გამოსვლა
        </button>
      </header>

      <div className="relative z-10 px-4 pb-2 pt-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${tab === t.key ? 'bg-white/[0.14] border border-white/20 text-white' : 'bg-white/[0.04] border border-transparent text-white/40'}`}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 px-4 pb-10 pt-3 max-w-2xl mx-auto w-full">
        {tab === 'overview' && <OverviewTab stats={stats} />}
        {tab === 'menu' && <MenuTab restaurants={restaurants} />}
        {tab === 'users' && <UsersTab restaurants={restaurants} />}
        {tab === 'stats' && <StatsTab />}
      </div>
    </main>
  );
}
