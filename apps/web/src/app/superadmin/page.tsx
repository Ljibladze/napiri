'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { api, saveSession, clearSession, getToken, getUser } from '@/lib/api';
import { WaveBackground } from '@/components/layout/WaveBackground';

type Tab = 'overview' | 'restaurants' | 'menu' | 'users' | 'couriers' | 'stats' | 'qr';

const COVER_CLASSES = ['grad-olympos', 'grad-bluebay', 'grad-sanapiro', 'grad-olympos'];
const ROLE_LABEL: Record<string, string> = { superAdmin: 'SuperAdmin', restaurantAdmin: 'რესტორანი', courier: 'კურიერი' };
const ROLE_COLOR: Record<string, string> = {
  superAdmin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  restaurantAdmin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  courier: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};
const STATUS_GE: Record<string, string> = {
  pending: 'მოლოდინი', confirmed: 'დადასტურდა', preparing: 'მზადდება',
  delivering: 'გზაშია', delivered: 'ჩაბარდა', cancelled: 'გაუქმდა',
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 ${className}`}>{children}</div>;
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
function Inp({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</label>
      <input {...props} className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all" />
    </div>
  );
}
function Sel({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</label>
      <select {...props} className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all">{children}</select>
    </div>
  );
}
function Btn({ variant = 'primary', children, className = '', ...props }: { variant?: 'primary' | 'danger' | 'ghost' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = { primary: 'bg-ocean-600/70 border-ocean-500/40 text-white', danger: 'bg-red-600/40 border-red-500/30 text-red-300', ghost: 'bg-white/[0.06] border-white/[0.10] text-white/70' };
  return <button {...props} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 disabled:opacity-50 ${v[variant]} ${className}`}>{children}</button>;
}
function Spinner() { return <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />; }

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!username || !password) return;
    setLoading(true); setError('');
    try {
      const res = await api.auth.login(username, password);
      if (res.user.role !== 'superAdmin') { setError('წვდომა აკრძალულია'); return; }
      saveSession(res.token, res.user);
      onLogin();
    } catch { setError('არასწორი მომხმარებელი ან პაროლი'); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh px-5">
      <div className="w-full max-w-sm admin-card rounded-3xl p-7 space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">⚡</div>
          <h1 className="text-white font-black text-2xl">SuperAdmin</h1>
          <p className="text-white/40 text-sm">ნაპირი · ქობულეთი</p>
        </div>
        <Inp label="მომხმარებელი" type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && handle()} placeholder="superadmin" />
        <Inp label="პაროლი" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && handle()} placeholder="••••••••" />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button onClick={handle} disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-btn-ocean shadow-ocean active:scale-[0.97] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <Spinner /> : 'შესვლა'}
        </button>
      </div>
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
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
        <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">რესტორნები</h3>
        <div className="space-y-2">
          {stats.byRestaurant?.map((r: any) => (
            <Card key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2"><span>{r.emoji}</span><span className="text-white font-semibold text-sm">{r.name}</span></div>
              <div className="flex gap-4 text-right">
                <div><div className="text-sky-300 font-black text-sm">{r.orders}</div><div className="text-white/30 text-[10px]">შეკ.</div></div>
                <div><div className="text-emerald-300 font-black text-sm">₾{r.revenue.toFixed(0)}</div><div className="text-white/30 text-[10px]">შემ.</div></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Restaurants ───────────────────────────────────────────────────────────────
function RestaurantsTab() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { type: 'add' | 'edit'; r?: any }>(null);
  const [form, setForm] = useState({ id: '', name: '', description: '', emoji: '', coverClass: 'grad-olympos', rating: '4.5', deliveryTime: '15-20 წთ', tags: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.restaurants.listAdmin().then(setRestaurants).catch(console.error).finally(() => setLoading(false)); }, []);

  function openAdd() {
    setForm({ id: '', name: '', description: '', emoji: '', coverClass: 'grad-olympos', rating: '4.5', deliveryTime: '15-20 წთ', tags: '' });
    setModal({ type: 'add' });
  }
  function openEdit(r: any) {
    setForm({ id: r.id, name: r.name, description: r.description, emoji: r.emoji, coverClass: r.coverClass, rating: String(r.rating), deliveryTime: r.deliveryTime, tags: r.tags?.join(', ') ?? '' });
    setModal({ type: 'edit', r });
  }

  async function handleSave() {
    if (!form.name || !form.emoji) return;
    setSaving(true);
    try {
      const payload = {
        id: form.id || String(Date.now()),
        name: form.name, description: form.description, emoji: form.emoji,
        coverClass: form.coverClass, rating: parseFloat(form.rating) || 4.5,
        deliveryTime: form.deliveryTime,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      if (modal?.type === 'add') {
        const created = await api.restaurants.create(payload);
        setRestaurants((p) => [...p, created]);
      } else {
        const updated = await api.restaurants.update(modal!.r.id, payload);
        setRestaurants((p) => p.map((r) => r.id === updated.id ? updated : r));
      }
      setModal(null);
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setSaving(false); }
  }

  async function toggleActive(r: any) {
    try {
      const updated = await api.restaurants.update(r.id, { active: !r.active });
      setRestaurants((p) => p.map((x) => x.id === updated.id ? updated : x));
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">რესტორნები</h3>
        <Btn onClick={openAdd}>+ დამატება</Btn>
      </div>
      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <div className="space-y-2">
          {restaurants.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 py-3">
              <span className="text-3xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold">{r.name}</p>
                <p className="text-white/40 text-xs truncate">{r.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(r)}
                  className={`text-[10px] font-bold border rounded-full px-2.5 py-1 transition-all ${r.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                  {r.active ? 'აქტიური' : 'გათიშული'}
                </button>
                <Btn variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => openEdit(r)}>✏️</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={modal.type === 'add' ? '+ ახალი რესტორანი' : '✏️ რედაქტირება'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Inp label="სახელი" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ოლიმპოსი" />
              <Inp label="ემოჯი" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🏛️" />
            </div>
            <Inp label="აღწერა" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="ქართული სამზარეულო" />
            <div className="grid grid-cols-2 gap-3">
              <Inp label="შეფასება" type="number" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} placeholder="4.8" />
              <Inp label="მიტანის დრო" value={form.deliveryTime} onChange={(e) => setForm((f) => ({ ...f, deliveryTime: e.target.value }))} placeholder="15-20 წთ" />
            </div>
            <Sel label="სტილი" value={form.coverClass} onChange={(e) => setForm((f) => ({ ...f, coverClass: e.target.value }))}>
              {COVER_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Sel>
            <Inp label="თეგები (მძიმით)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="ქართული, ბურგერი" />
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1" onClick={() => setModal(null)}>გაუქმება</Btn>
              <Btn className="flex-1" disabled={saving} onClick={handleSave}>{saving ? <Spinner /> : 'შენახვა'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Menu ─────────────────────────────────────────────────────────────────────
function MenuTab({ restaurants }: { restaurants: any[] }) {
  const [selectedR, setSelectedR] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [modal, setModal] = useState<null | { type: 'add' | 'edit'; item?: any }>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', emoji: '🍽️', category: '', special: false });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async (r: any) => {
    setSelectedR(r); setLoadingItems(true);
    try { setItems(await api.menu.list(r.id)); } catch { } finally { setLoadingItems(false); }
  }, []);

  async function handleSave() {
    if (!form.name || !form.price || !form.category || !selectedR) return;
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description || undefined, price: parseFloat(form.price), emoji: form.emoji, category: form.category, special: form.special, restaurantId: selectedR.id };
      if (modal?.type === 'add') { const created = await api.menu.create(payload); setItems((p) => [...p, created]); }
      else { const u = await api.menu.update(modal!.item.id, payload); setItems((p) => p.map((i) => i.id === u.id ? u : i)); }
      setModal(null);
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('წაიშალოს?')) return;
    setDeletingId(id);
    try { await api.menu.remove(id); setItems((p) => p.filter((i) => i.id !== id)); }
    catch (e: any) { alert(e.message); } finally { setDeletingId(null); }
  }

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">რესტორანი</p>
        <div className="flex flex-wrap gap-2">
          {restaurants.filter((r) => r.active).map((r) => (
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
            <Btn onClick={() => { setForm({ name: '', description: '', price: '', emoji: '🍽️', category: '', special: false }); setModal({ type: 'add' }); }}>+ დამატება</Btn>
          </div>
          {loadingItems ? <div className="flex justify-center py-8"><Spinner /></div> : categories.map((cat) => (
            <div key={cat}>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">{cat}</p>
              <div className="space-y-2">
                {items.filter((i) => i.category === cat).map((item) => (
                  <Card key={item.id} className="flex items-center gap-3 py-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${item.special ? 'text-amber-300' : 'text-white'}`}>{item.name}{item.special && <span className="ml-1.5 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/20 rounded-full px-1.5 py-0.5">⭐</span>}</p>
                      {item.description && <p className="text-white/35 text-xs truncate">{item.description}</p>}
                    </div>
                    <span className="text-emerald-300 font-black text-sm shrink-0">₾{item.price}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <Btn variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => { setForm({ name: item.name, description: item.description ?? '', price: String(item.price), emoji: item.emoji, category: item.category, special: item.special }); setModal({ type: 'edit', item }); }}>✏️</Btn>
                      <Btn variant="danger" className="px-2.5 py-1.5 text-xs" disabled={deletingId === item.id} onClick={() => handleDelete(item.id)}>{deletingId === item.id ? '...' : '🗑️'}</Btn>
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
            <Inp label="სახელი" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ბურგერი" />
            <Inp label="აღწერა" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="200გ საქონელი..." />
            <div className="grid grid-cols-2 gap-3">
              <Inp label="ფასი (₾)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="15" />
              <Inp label="ემოჯი" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} placeholder="🍔" />
            </div>
            <Inp label="კატეგორია" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="სენდვიჩები" />
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setForm((f) => ({ ...f, special: !f.special }))}>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.special ? 'bg-amber-500' : 'bg-white/20'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.special ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-white/70 text-sm">სპეციალური კერძი ⭐</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1" onClick={() => setModal(null)}>გაუქმება</Btn>
              <Btn className="flex-1" disabled={saving} onClick={handleSave}>{saving ? <Spinner /> : 'შენახვა'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function UsersTab({ restaurants }: { restaurants: any[] }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [reassignModal, setReassignModal] = useState<any>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'courier', restaurantId: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newRestaurantId, setNewRestaurantId] = useState('');

  useEffect(() => { api.users.list().then(setUsers).catch(console.error).finally(() => setLoading(false)); }, []);

  async function handleCreate() {
    if (!form.username || !form.password) return;
    setSaving(true);
    try {
      const created = await api.users.create({ username: form.username, password: form.password, role: form.role, restaurantId: form.restaurantId || undefined });
      setUsers((p) => [created, ...p]);
      setModal(false);
      setForm({ username: '', password: '', role: 'courier', restaurantId: '' });
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('წაიშალოს?')) return;
    setDeletingId(id);
    try { await api.users.remove(id); setUsers((p) => p.filter((u) => u.id !== id)); }
    catch (e: any) { alert(e.message); } finally { setDeletingId(null); }
  }

  async function handleReassign() {
    if (!reassignModal) return;
    setSaving(true);
    try {
      const updated = await api.users.reassign(reassignModal.id, newRestaurantId || null);
      setUsers((p) => p.map((u) => u.id === updated.id ? updated : u));
      setReassignModal(null);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">მომხმარებლები</h3>
        <Btn onClick={() => setModal(true)}>+ დამატება</Btn>
      </div>
      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.07] flex items-center justify-center text-lg shrink-0">
                {u.role === 'superAdmin' ? '⚡' : u.role === 'courier' ? '🏍️' : '🏪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{u.username}</p>
                {u.restaurantId && <p className="text-white/35 text-xs">{restaurants.find((r) => r.id === u.restaurantId)?.name ?? u.restaurantId}</p>}
              </div>
              <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
              {u.role === 'courier' && (
                <Btn variant="ghost" className="px-2.5 py-1.5 text-xs shrink-0" onClick={() => { setNewRestaurantId(u.restaurantId ?? ''); setReassignModal(u); }}>🔀</Btn>
              )}
              {u.role !== 'superAdmin' && (
                <Btn variant="danger" className="px-2.5 py-1.5 text-xs shrink-0" disabled={deletingId === u.id} onClick={() => handleDelete(u.id)}>
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
            <Inp label="მომხმარებელი" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="courier2" />
            <Inp label="პაროლი" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            <Sel label="როლი" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="courier">კურიერი</option>
              <option value="restaurantAdmin">რესტორნის ადმინი</option>
              <option value="superAdmin">SuperAdmin</option>
            </Sel>
            {(form.role === 'restaurantAdmin' || form.role === 'courier') && (
              <Sel label="რესტორანი" value={form.restaurantId} onChange={(e) => setForm((f) => ({ ...f, restaurantId: e.target.value }))}>
                <option value="">-- არცერთი --</option>
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
              </Sel>
            )}
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1" onClick={() => setModal(false)}>გაუქმება</Btn>
              <Btn className="flex-1" disabled={saving} onClick={handleCreate}>{saving ? <Spinner /> : 'შენახვა'}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {reassignModal && (
        <Modal title="🔀 კურიერის გადაბმა" onClose={() => setReassignModal(null)}>
          <div className="space-y-3">
            <p className="text-white/60 text-sm">კურიერი: <span className="text-white font-bold">{reassignModal.username}</span></p>
            <Sel label="ახალი რესტორანი" value={newRestaurantId} onChange={(e) => setNewRestaurantId(e.target.value)}>
              <option value="">-- არცერთი --</option>
              {restaurants.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
            </Sel>
            <div className="flex gap-2 pt-1">
              <Btn variant="ghost" className="flex-1" onClick={() => setReassignModal(null)}>გაუქმება</Btn>
              <Btn className="flex-1" disabled={saving} onClick={handleReassign}>{saving ? <Spinner /> : 'შენახვა'}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Couriers Stats ────────────────────────────────────────────────────────────
function CouriersTab({ restaurants }: { restaurants: any[] }) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterR, setFilterR] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setStats(await api.orders.courierStats(filterR || undefined)); }
    catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [filterR]);

  useEffect(() => { load(); }, [filterR]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-white font-black">კურიერების სტატისტიკა</h3>
        <select value={filterR} onChange={(e) => setFilterR(e.target.value)}
          className="bg-white/[0.07] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
          <option value="">ყველა რესტორანი</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
        </select>
      </div>
      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : stats.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">ჩაბარებული შეკვეთა ჯერ არ არის</div>
      ) : (
        <div className="space-y-3">
          {stats.map((c, i) => (
            <Card key={c.courierId} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ocean-600/20 border border-ocean-500/30 flex items-center justify-center font-black text-white text-lg">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-black">🏍️ {c.username}</p>
                  {c.restaurantId && <p className="text-white/35 text-xs">{restaurants.find((r) => r.id === c.restaurantId)?.name}</p>}
                </div>
                <div className="text-right">
                  <div className="text-sky-300 font-black text-lg">{c.deliveries}</div>
                  <div className="text-white/30 text-[10px]">ჩაბარება</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-300 font-black text-sm">₾{c.revenue.toFixed(0)}</div>
                  <div className="text-white/30 text-[10px]">ჯამი</div>
                </div>
              </div>
              {c.byRestaurant?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
                  {c.byRestaurant.map((r: any) => (
                    <span key={r.id} className="text-xs bg-white/[0.06] border border-white/[0.08] rounded-lg px-2.5 py-1 text-white/60">
                      {r.emoji} {r.name}: <span className="text-sky-300 font-bold">{r.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
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
          <Btn onClick={load} disabled={loading} className="shrink-0 px-5">{loading ? <Spinner /> : '🔍'}</Btn>
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
                <Card key={st} className="text-center py-2"><div className="text-white font-black text-lg">{cnt}</div><div className="text-white/35 text-[10px]">{STATUS_GE[st] ?? st}</div></Card>
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
                      <div className="bg-ocean-500 h-1 rounded-full" style={{ width: stats.totalOrders ? `${(r.orders / stats.totalOrders) * 100}%` : '0%' }} />
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

// ── QR Generator ──────────────────────────────────────────────────────────────
function QRTab() {
  const [loungeId, setLoungeId] = useState('');
  const [generated, setGenerated] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrReady, setQrReady] = useState(false);

  const URL_BASE = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '').replace('napiri.onrender.com', 'napiri-web.vercel.app')
    : (typeof window !== 'undefined' ? window.location.origin : '');

  async function generate() {
    if (!loungeId) return;
    const url = `${URL_BASE}/lounge/${loungeId}`;
    setGenerated(url);
    setQrReady(false);

    await new Promise((r) => setTimeout(r, 50));

    if (!canvasRef.current) return;
    const QRCode = (await import('qrcode')).default;

    const tempCanvas = document.createElement('canvas');
    await QRCode.toCanvas(tempCanvas, url, {
      width: 260,
      margin: 2,
      color: { dark: '#0a1628', light: '#f0f9ff' },
    });

    const W = 420, H = 540;
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width = W;
    canvasRef.current.height = H;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#060f1e');
    bg.addColorStop(0.5, '#091525');
    bg.addColorStop(1, '#06111c');
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, W, H, 28);
    ctx.fill();

    // Ocean wave decoration top
    ctx.fillStyle = 'rgba(0, 180, 216, 0.08)';
    ctx.beginPath();
    ctx.ellipse(W / 2, -20, W * 0.8, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing orb behind logo
    const glow = ctx.createRadialGradient(W / 2, 72, 0, W / 2, 72, 60);
    glow.addColorStop(0, 'rgba(0,180,216,0.25)');
    glow.addColorStop(1, 'rgba(0,180,216,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(W / 2, 72, 60, 0, Math.PI * 2); ctx.fill();

    // Brand name
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ნაპირი', W / 2, 78);

    // Subtitle
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.letterSpacing = '0.15em';
    ctx.fillText('NAPIRI · KOBULETI', W / 2, 102);
    ctx.letterSpacing = '0';

    // Divider line
    ctx.strokeStyle = 'rgba(0, 180, 216, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 118); ctx.lineTo(W - 40, 118); ctx.stroke();

    // Lounge label
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('შეზლონგი', W / 2, 142);

    // Lounge number — big
    ctx.font = 'bold 68px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`#${loungeId}`, W / 2, 208);

    // QR code white card
    const QR_SIZE = 230;
    const QR_X = (W - QR_SIZE) / 2;
    const QR_Y = 224;
    const padding = 14;
    ctx.fillStyle = '#f0f9ff';
    roundRect(ctx, QR_X - padding, QR_Y - padding, QR_SIZE + padding * 2, QR_SIZE + padding * 2, 16);
    ctx.fill();

    // QR code dot glow
    const qGlow = ctx.createRadialGradient(W / 2, QR_Y + QR_SIZE / 2, 0, W / 2, QR_Y + QR_SIZE / 2, QR_SIZE / 1.5);
    qGlow.addColorStop(0, 'rgba(0,180,216,0.06)');
    qGlow.addColorStop(1, 'rgba(0,180,216,0)');
    ctx.fillStyle = qGlow;
    ctx.fillRect(QR_X - padding, QR_Y - padding, QR_SIZE + padding * 2, QR_SIZE + padding * 2);

    ctx.drawImage(tempCanvas, QR_X, QR_Y, QR_SIZE, QR_SIZE);

    // Bottom text
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('📱 სკანირეთ შეკვეთის გასაკეთებლად', W / 2, QR_Y + QR_SIZE + padding * 2 + 22);

    // Ocean wave decoration bottom
    ctx.fillStyle = 'rgba(0, 180, 216, 0.06)';
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 20, W * 0.8, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    setQrReady(true);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = `napiri-lounge-${loungeId}.png`;
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  }

  function handlePrint() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const w = window.open('');
    w?.document.write(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000"><img src="${dataUrl}" style="max-width:420px;border-radius:28px"></body></html>`);
    w?.document.close();
    w?.focus();
    setTimeout(() => { w?.print(); }, 500);
  }

  return (
    <div className="space-y-5 max-w-sm mx-auto">
      <div className="space-y-3">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">შეზლონგის ნომერი</p>
        <div className="flex gap-2">
          <input type="number" value={loungeId} onChange={(e) => setLoungeId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            className="flex-1 bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3.5 text-white text-xl font-black text-center focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all placeholder-white/20"
            placeholder="12" min="1" />
          <Btn onClick={generate} disabled={!loungeId} className="px-6 text-base">QR</Btn>
        </div>
      </div>

      {generated && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-3xl shadow-[0_0_60px_rgba(0,180,216,0.2)] max-w-full" style={{ maxWidth: 320 }} />
          </div>
          {qrReady && (
            <div className="flex gap-3">
              <button onClick={handleDownload}
                className="flex-1 py-3 rounded-2xl font-black text-white text-sm bg-ocean-600/70 border border-ocean-500/40 active:scale-95 transition-all flex items-center justify-center gap-2">
                ⬇️ გადმოწერა
              </button>
              <button onClick={handlePrint}
                className="flex-1 py-3 rounded-2xl font-black text-white text-sm bg-white/[0.08] border border-white/[0.12] active:scale-95 transition-all flex items-center justify-center gap-2">
                🖨️ ამობეჭდვა
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (token && user?.role === 'superAdmin') setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    api.restaurants.listAdmin().then(setRestaurants).catch(console.error);
    api.stats.get().then(setStats).catch(console.error);
  }, [authed]);

  const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key: 'overview',     label: 'მიმოხილვა',  emoji: '📊' },
    { key: 'restaurants',  label: 'რესტ.',       emoji: '🏪' },
    { key: 'menu',         label: 'მენიუ',       emoji: '🍽️' },
    { key: 'users',        label: 'იუზერები',   emoji: '👥' },
    { key: 'couriers',     label: 'კურიერები',  emoji: '🏍️' },
    { key: 'stats',        label: 'სტატ.',       emoji: '📈' },
    { key: 'qr',           label: 'QR კოდი',    emoji: '📱' },
  ];

  if (!authed) {
    return (
      <main className="relative min-h-dvh">
        <WaveBackground />
        <div className="relative z-10">
          <LoginScreen onLogin={() => setAuthed(true)} />
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
        <button onClick={() => { clearSession(); setAuthed(false); }}
          className="text-white/30 hover:text-white/60 text-sm transition-colors px-3 py-1.5 rounded-xl bg-white/[0.05]">
          გამოსვლა
        </button>
      </header>

      <div className="relative z-10 px-4 pb-2 pt-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${tab === t.key ? 'bg-white/[0.14] border border-white/20 text-white' : 'bg-white/[0.04] border border-transparent text-white/40'}`}>
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 px-4 pb-10 pt-3 max-w-2xl mx-auto w-full">
        {tab === 'overview'    && <OverviewTab stats={stats} />}
        {tab === 'restaurants' && <RestaurantsTab />}
        {tab === 'menu'        && <MenuTab restaurants={restaurants} />}
        {tab === 'users'       && <UsersTab restaurants={restaurants} />}
        {tab === 'couriers'    && <CouriersTab restaurants={restaurants} />}
        {tab === 'stats'       && <StatsTab />}
        {tab === 'qr'          && <QRTab />}
      </div>
    </main>
  );
}
