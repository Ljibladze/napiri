'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { playNewOrder } from '@/lib/sounds';
import type { Order, OrderStatus } from '@/types';
import { api, saveSession, clearSession, getUser, getToken } from '@/lib/api';
import { uploadImage } from '@/lib/cloudinary';
import { useSocket } from '@/hooks/useSocket';
import { WaveBackground } from '@/components/layout/WaveBackground';
import { OrderCard } from '@/components/admin/OrderCard';
import { STATUS_LABEL } from '@/lib/utils';

type FilterTab = 'all' | OrderStatus;
type AdminTab = 'orders' | 'menu' | 'couriers' | 'stats';

const FILTER_TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all',        label: 'ყველა',              emoji: '📋' },
  { key: 'pending',    label: STATUS_LABEL.pending,   emoji: '🕐' },
  { key: 'confirmed',  label: STATUS_LABEL.confirmed, emoji: '✅' },
  { key: 'preparing',  label: STATUS_LABEL.preparing, emoji: '👨‍🍳' },
  { key: 'delivering', label: STATUS_LABEL.delivering,emoji: '🏃' },
  { key: 'delivered',  label: STATUS_LABEL.delivered, emoji: '🎉' },
];

// ── Image Picker ─────────────────────────────────────────────────────────────

function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err: any) {
      alert(err.message ?? 'ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">სურათი</label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl border border-white/[0.10] bg-white/[0.05] overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/20 text-2xl">🖼️</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.07] border border-white/[0.10] text-white/70 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
            {uploading ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : '📁'}
            {uploading ? 'იტვირთება...' : 'ფოტოს არჩევა'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 active:scale-95 transition-all">
              წაშლა
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Menu Tab ──────────────────────────────────────────────────────────────────

function MenuTab({ user }: { user: any }) {
  const isSuperAdmin = user?.role === 'superAdmin';
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(user?.restaurantId ?? '');
  const activeRestaurantId = isSuperAdmin ? selectedRestaurantId : (user?.restaurantId ?? '');

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { type: 'add' | 'edit'; item?: any }>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', emoji: '🍽️', imageUrl: '', category: '', newCategory: '', special: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      api.restaurants.list().then(setRestaurants).catch(console.error);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!activeRestaurantId) { setLoading(false); return; }
    setLoading(true);
    api.menu.list(activeRestaurantId)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    setSaveError('');
    const finalCategory = form.category === '__new__' ? form.newCategory : form.category;
    if (!form.name.trim()) { setSaveError('სახელი სავალდებულოა'); return; }
    if (!form.price) { setSaveError('ფასი სავალდებულოა'); return; }
    if (!finalCategory.trim()) { setSaveError('კატეგორია სავალდებულოა'); return; }
    if (!activeRestaurantId) { setSaveError('რესტორანი არჩეული არ არის'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        emoji: form.emoji,
        imageUrl: form.imageUrl || undefined,
        category: finalCategory,
        special: form.special,
      };
      if (modal?.type === 'add') {
        const created = await api.menu.create({ ...payload, restaurantId: activeRestaurantId });
        setItems((p) => [...p, created]);
      } else {
        const updated = await api.menu.update(modal!.item.id, payload);
        setItems((p) => p.map((i) => i.id === updated.id ? updated : i));
      }
      setModal(null);
    } catch (e: any) { setSaveError(e.message ?? 'შეცდომა — სცადე თავიდან'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('წაიშალოს?')) return;
    setDeletingId(id);
    try {
      await api.menu.remove(id);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  }

  function openAdd() {
    setSaveError('');
    setForm({ name: '', description: '', price: '', emoji: '🍽️', imageUrl: '', category: '', newCategory: '', special: false });
    setModal({ type: 'add' });
  }
  function openEdit(item: any) {
    setSaveError('');
    setForm({ name: item.name, description: item.description ?? '', price: String(item.price), emoji: item.emoji, imageUrl: item.imageUrl ?? '', category: item.category, newCategory: '', special: item.special });
    setModal({ type: 'edit', item });
  }

  const sortedItems = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const categories = [...new Set(sortedItems.map((i) => i.category))];

  async function handleRenameCategory(oldName: string) {
    const catItems = items.filter((i) => i.category === oldName);
    for (const item of catItems) {
      const updated = await api.menu.update(item.id, { category: renameVal.trim() });
      setItems((p) => p.map((i) => i.id === updated.id ? updated : i));
    }
    setRenamingCat(null);
  }

  async function moveItem(item: any, dir: 'up' | 'down') {
    const catItems = sortedItems.filter((i) => i.category === item.category);
    const idx = catItems.findIndex((i) => i.id === item.id);
    const swap = dir === 'up' ? catItems[idx - 1] : catItems[idx + 1];
    if (!swap) return;
    setMovingId(item.id);
    try {
      const [a, b] = await Promise.all([
        api.menu.update(item.id, { sortOrder: swap.sortOrder }),
        api.menu.update(swap.id, { sortOrder: item.sortOrder }),
      ]);
      setItems((p) => p.map((i) => i.id === a.id ? a : i.id === b.id ? b : i));
    } finally { setMovingId(null); }
  }

  async function moveCategory(cat: string, dir: 'up' | 'down') {
    const idx = categories.indexOf(cat);
    const swapCat = dir === 'up' ? categories[idx - 1] : categories[idx + 1];
    if (!swapCat) return;
    const catItems = sortedItems.filter((i) => i.category === cat);
    const swapItems = sortedItems.filter((i) => i.category === swapCat);
    const allOrders = [...catItems, ...swapItems].map((i) => i.sortOrder).sort((a, b) => a - b);
    const movingGroup = dir === 'up' ? catItems : swapItems;
    const stayGroup   = dir === 'up' ? swapItems : catItems;
    const updates = await Promise.all([
      ...movingGroup.map((item, i) => api.menu.update(item.id, { sortOrder: allOrders[i] })),
      ...stayGroup.map((item, i)   => api.menu.update(item.id, { sortOrder: allOrders[movingGroup.length + i] })),
    ]);
    setItems((p) => {
      let next = [...p];
      for (const u of updates) next = next.map((i) => i.id === u.id ? u : i);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black">მენიუ</h3>
        <button onClick={openAdd} disabled={!activeRestaurantId}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-ocean-600/70 border border-ocean-500/40 text-white active:scale-95 transition-all disabled:opacity-40">
          + კერძის დამატება
        </button>
      </div>

      {isSuperAdmin && (
        <div className="space-y-1.5">
          <p className="text-white/35 text-xs font-bold uppercase tracking-widest">რესტორანი</p>
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="w-full bg-white/[0.07] border border-white/[0.12] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/40"
          >
            <option value="">— აირჩიე რესტორანი —</option>
            {restaurants.map((r: any) => (
              <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">მენიუ ცარიელია</div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, catIdx) => {
            const catItems = sortedItems.filter((i) => i.category === cat);
            return (
            <div key={cat}>
              {/* Category header */}
              <div className="flex items-center gap-2 mb-2">
                {renamingCat === cat ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(cat); if (e.key === 'Escape') setRenamingCat(null); }}
                      autoFocus
                      className="flex-1 bg-white/[0.08] border border-ocean-500/40 rounded-lg px-2 py-1 text-white text-xs font-bold focus:outline-none"
                    />
                    <button onClick={() => handleRenameCategory(cat)} className="text-xs px-2 py-1 rounded-lg bg-ocean-600/60 text-white font-bold">✓</button>
                    <button onClick={() => setRenamingCat(null)} className="text-xs px-2 py-1 rounded-lg bg-white/[0.08] text-white/50 font-bold">✕</button>
                  </div>
                ) : (
                  <>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider flex-1">{cat}</p>
                    <button onClick={() => { setRenamingCat(cat); setRenameVal(cat); }} className="text-white/25 hover:text-white/70 text-xs transition-colors px-1.5">✏️</button>
                    <button onClick={() => moveCategory(cat, 'up')} disabled={catIdx === 0} className="text-white/25 hover:text-white/70 disabled:opacity-20 text-xs px-1 transition-colors">▲</button>
                    <button onClick={() => moveCategory(cat, 'down')} disabled={catIdx === categories.length - 1} className="text-white/25 hover:text-white/70 disabled:opacity-20 text-xs px-1 transition-colors">▼</button>
                  </>
                )}
              </div>
              <div className="space-y-2">
                {catItems.map((item, itemIdx) => (
                  <div key={item.id} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3">
                    {/* Move up/down */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => moveItem(item, 'up')} disabled={itemIdx === 0 || movingId === item.id} className="text-white/20 hover:text-white/60 disabled:opacity-10 text-[10px] leading-none transition-colors">▲</button>
                      <button onClick={() => moveItem(item, 'down')} disabled={itemIdx === catItems.length - 1 || movingId === item.id} className="text-white/20 hover:text-white/60 disabled:opacity-10 text-[10px] leading-none transition-colors">▼</button>
                    </div>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/[0.07] border border-white/[0.08] flex items-center justify-center shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{item.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${item.special ? 'text-amber-300' : 'text-white'}`}>
                        {item.name}
                        {item.special && <span className="ml-1.5 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/20 rounded-full px-1.5 py-0.5">⭐</span>}
                      </p>
                      {item.description && <p className="text-white/35 text-xs truncate">{item.description}</p>}
                      <p className="text-emerald-300 font-black text-sm mt-0.5">₾{item.price}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => openEdit(item)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] border border-white/[0.10] text-white/70 active:scale-95 transition-all">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-600/30 border border-red-500/20 text-red-300 active:scale-95 transition-all disabled:opacity-50">
                        {deletingId === item.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d1b2a] border border-white/[0.12] rounded-3xl p-6 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-lg">{modal.type === 'add' ? '+ კერძის დამატება' : '✏️ კერძის რედაქტირება'}</h3>
              <button onClick={() => { setModal(null); setSaveError(''); }} className="text-white/40 hover:text-white text-xl transition-colors">✕</button>
            </div>
            {saveError && (
              <div className="text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                ⚠️ {saveError}
              </div>
            )}
            <div className="space-y-3">
              <ImagePicker value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">სახელი</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all"
                  placeholder="ბურგერი" />
              </div>
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">აღწერა</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all"
                  placeholder="200გ საქონელი..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">ფასი (₾)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all"
                    placeholder="15" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">კატეგორია</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                    className="w-full border border-white/[0.10] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all">
                    <option value="">-- აირჩიე --</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__new__">+ ახალი კატეგორია</option>
                  </select>
                  {form.category === '__new__' && (
                    <input value={form.newCategory} onChange={(e) => setForm((f) => ({ ...f, newCategory: e.target.value }))}
                      className="w-full bg-white/[0.07] border border-white/[0.10] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500/50 transition-all mt-2"
                      placeholder="კატეგორიის სახელი" autoFocus />
                  )}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer" onClick={() => setForm((f) => ({ ...f, special: !f.special }))}>
                <div className={`w-10 h-6 rounded-full transition-colors relative ${form.special ? 'bg-amber-500' : 'bg-white/20'}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.special ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-white/70 text-sm">სპეციალური კერძი ⭐</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/[0.06] border border-white/[0.10] text-white/70 active:scale-95 transition-all">
                გაუქმება
              </button>
              <button onClick={handleSave} disabled={saving}
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

// ── Couriers Tab ──────────────────────────────────────────────────────────────

function AddRestaurantInline({ courierId, available, onAdd }: {
  courierId: string;
  available: any[];
  onAdd: (courierId: string, rId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (available.length === 0) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs bg-ocean-600/20 border border-ocean-500/30 text-sky-400 rounded-lg px-2 py-0.5 font-bold active:scale-95 transition-all">
        + რესტ.
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-[#0d1b2a] border border-white/[0.12] rounded-xl p-1 shadow-xl min-w-[140px]">
            {available.map((r: any) => (
              <button key={r.id}
                onClick={() => { onAdd(courierId, r.id); setOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/[0.07] transition-all">
                {r.emoji} {r.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CouriersTab({ user }: { user: any }) {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    api.users.list().then(setCouriers).catch(console.error).finally(() => setLoading(false));
    api.restaurants.listAdmin().then(setRestaurants).catch(() =>
      api.restaurants.list().then(setRestaurants).catch(console.error)
    );
    const rId = user.role === 'restaurantAdmin' ? user.restaurantId : undefined;
    api.orders.courierStats(rId).then(setStats).catch(console.error);
  }, []);

  function getStats(courierId: string) {
    return stats.find((s) => s.courierId === courierId);
  }

  function availableFor(courier: any) {
    const assigned: string[] = courier.restaurantIds ?? [];
    if (user.role === 'restaurantAdmin') {
      return assigned.includes(user.restaurantId) ? [] : restaurants.filter((r: any) => r.id === user.restaurantId);
    }
    return restaurants.filter((r: any) => !assigned.includes(r.id));
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

  async function handleAddRestaurant(courierId: string, restaurantId: string) {
    try {
      const updated = await api.users.addRestaurant(courierId, restaurantId);
      setCouriers((p) => p.map((c) => c.id === courierId ? { ...c, restaurantIds: updated.restaurantIds } : c));
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
  }

  async function handleRemoveRestaurant(courierId: string, restaurantId: string) {
    try {
      const updated = await api.users.removeRestaurant(courierId, restaurantId);
      setCouriers((p) => p.map((c) => c.id === courierId ? { ...c, restaurantIds: updated.restaurantIds } : c));
    } catch (e: any) { alert(e.message ?? 'შეცდომა'); }
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
            const assigned: string[] = c.restaurantIds ?? [];
            return (
              <div key={c.id} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 space-y-3">
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

                {/* Restaurant assignments */}
                <div className="flex flex-wrap items-center gap-2">
                  {assigned.map((rid) => {
                    const r = restaurants.find((r: any) => r.id === rid);
                    const canRemove = user.role === 'superAdmin' || user.restaurantId === rid;
                    const label = r ? `${r.emoji} ${r.name}` : rid.slice(0, 8);
                    return (
                      <span key={rid} className="inline-flex items-center gap-1 text-xs bg-white/[0.10] border border-white/[0.15] rounded-lg pl-2.5 pr-1 py-1 text-white/80">
                        {label}
                        {canRemove && (
                          <button onClick={() => handleRemoveRestaurant(c.id, rid)}
                            className="ml-0.5 w-4 h-4 flex items-center justify-center rounded bg-white/[0.10] hover:bg-red-500/40 text-white/60 hover:text-white transition-all text-[13px] font-black leading-none">
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                  <AddRestaurantInline
                    courierId={c.id}
                    available={availableFor(c)}
                    onAdd={handleAddRestaurant}
                  />
                  {assigned.length === 0 && restaurants.length > 0 && (
                    <span className="text-white/20 text-xs italic">რესტ. არ არის</span>
                  )}
                </div>
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

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function StatsTab({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(isoDate(new Date()));

  useEffect(() => {
    setLoading(true);
    setStats(null);
    const from = selectedDate ? `${selectedDate}T00:00:00.000Z` : undefined;
    const to   = selectedDate ? selectedDate : undefined;
    const rId = user.role === 'restaurantAdmin' ? user.restaurantId : undefined;
    api.stats.get(from, to).then((data) => {
      if (rId) {
        const rStat = data.byRestaurant?.find((r: any) => r.id === rId);
        const rOrders = data.recent?.filter((o: any) => o.restaurantId === rId) ?? [];
        const byStatus = rOrders.reduce((acc: Record<string, number>, o: any) => {
          acc[o.status] = (acc[o.status] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setStats({
          totalOrders: rStat?.orders ?? 0,
          totalRevenue: rStat?.revenue ?? 0,
          byStatus,
          serviceBreakdown: rStat?.serviceBreakdown ?? null,
          byCourier: data.byCourier?.filter((c: any) => c.restaurantId === rId || c.byRestaurant?.some((r: any) => r.id === rId)) ?? [],
        });
      } else {
        setStats(data);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [user, selectedDate]);

  const sb = stats?.serviceBreakdown;
  const todayStr = isoDate(new Date());

  return (
    <div className="space-y-5">
      {/* Date selector */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          max={todayStr}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 rounded-xl px-3 py-2 text-white text-sm font-medium bg-white/[0.07] border border-white/[0.10] focus:outline-none focus:ring-2 focus:ring-ocean-500/40 [color-scheme:dark]"
        />
        <button onClick={() => setSelectedDate(todayStr)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shrink-0 ${selectedDate === todayStr ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          დღეს
        </button>
        <button onClick={() => setSelectedDate('')}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shrink-0 ${selectedDate === '' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          ყველა
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" />
        </div>
      ) : !stats ? null : (
        <>
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

          {/* ── Service charge breakdown ───────────────────────── */}
          {sb && (
            <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
              <div className="px-4 py-3 border-b border-white/[0.07]">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">სერვის გადასახადი</p>
              </div>

              {/* Pickup row */}
              <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
                <span className="text-lg shrink-0">🚶</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm font-bold">Pickup</span>
                    <span className="text-white/30 text-xs bg-white/[0.07] px-1.5 py-0.5 rounded-full">{sb.pickupCount} შეკ.</span>
                    <span className="text-amber-300/70 text-xs font-semibold">+5%</span>
                  </div>
                  <div className="text-white/35 text-xs mt-0.5">სერვისი: <span className="text-white/60 font-bold">₾{sb.pickupServiceTotal.toFixed(2)}</span></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">პლატფ.</div>
                  <div className="text-emerald-300 font-black text-sm">₾{sb.pickupServiceTotal.toFixed(2)}</div>
                </div>
              </div>

              {/* Delivery row */}
              <div className="px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
                <span className="text-lg shrink-0">🏖️</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-sm font-bold">მიტანა</span>
                    <span className="text-white/30 text-xs bg-white/[0.07] px-1.5 py-0.5 rounded-full">{sb.deliveryCount} შეკ.</span>
                    <span className="text-sky-300/70 text-xs font-semibold">+15%</span>
                  </div>
                  <div className="text-white/35 text-xs mt-0.5">სერვისი: <span className="text-white/60 font-bold">₾{sb.deliveryServiceTotal.toFixed(2)}</span> · 50% / 50%</div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-[10px] text-white/30">კური. <span className="text-sky-300 font-black">₾{sb.courierShare.toFixed(2)}</span></div>
                  <div className="text-[10px] text-white/30">პლ. <span className="text-emerald-300 font-black">₾{(sb.deliveryServiceTotal / 2).toFixed(2)}</span></div>
                </div>
              </div>

              {/* Summary */}
              <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-white/[0.03]">
                <div className="text-center">
                  <div className="text-[10px] text-white/35 font-bold uppercase tracking-wider mb-1">🏍️ კურიერს ეკუთვნის</div>
                  <div className="text-xl font-black text-sky-300">₾{sb.courierShare.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-white/35 font-bold uppercase tracking-wider mb-1">🌊 პლატფორმა</div>
                  <div className="text-xl font-black text-emerald-300">₾{sb.platformShare.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

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
        </>
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
  const [restaurantActive, setRestaurantActive] = useState<boolean | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [togglingRestaurant, setTogglingRestaurant] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (token && user && (user.role === 'restaurantAdmin' || user.role === 'superAdmin')) {
      setCurrentUser(user);
      setAuthed(true);
      if (user.role === 'restaurantAdmin' && user.restaurantId) {
        api.restaurants.listAdmin().then((list) => {
          const r = list.find((x: any) => x.id === user.restaurantId);
          if (r) { setRestaurantActive(r.active); setRestaurantName(r.name); }
        }).catch(console.error);
      }
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
      if (res.user.role === 'restaurantAdmin' && res.user.restaurantId) {
        api.restaurants.listAdmin().then((list) => {
          const r = list.find((x: any) => x.id === res.user.restaurantId);
          if (r) setRestaurantActive(r.active);
        }).catch(console.error);
      }
    } catch {
      setAuthError(true);
    } finally {
      setAuthLoading(false);
    }
  }

  async function toggleRestaurant() {
    if (!currentUser?.restaurantId || restaurantActive === null) return;
    setTogglingRestaurant(true);
    try {
      const updated = await api.restaurants.update(currentUser.restaurantId, { active: !restaurantActive });
      setRestaurantActive(updated.active);
    } catch (e: any) { alert(e.message); }
    finally { setTogglingRestaurant(false); }
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
                  {connected ? `Live · ${currentUser?.role === 'restaurantAdmin' ? (restaurantName || currentUser?.username) : 'SuperAdmin'}` : 'კავშირი ეწყვეტა...'}
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
            {currentUser?.role === 'restaurantAdmin' && restaurantActive !== null && (
              <button onClick={toggleRestaurant} disabled={togglingRestaurant}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 disabled:opacity-60 ${restaurantActive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
                <span className={`w-2 h-2 rounded-full ${restaurantActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {togglingRestaurant ? '...' : restaurantActive ? 'ღია' : 'დახურული'}
              </button>
            )}
            <button onClick={handleLogout}
              className="text-white/30 hover:text-white/60 text-sm transition-colors px-3 py-1.5 rounded-xl font-medium bg-white/[0.05]">
              გამოსვლა
            </button>
          </div>
        </div>
      </header>

      {/* ── Tabs ────────────────────────────────── */}
      <div className="relative z-10 px-4 pt-3 pb-1 max-w-4xl mx-auto w-full flex gap-2 overflow-x-auto scrollbar-hide">
        <button onClick={() => setTab('orders')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'orders' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          📋 შეკვეთები
        </button>
        {(currentUser?.role === 'restaurantAdmin' || currentUser?.role === 'superAdmin') && (
          <button onClick={() => setTab('menu')}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'menu' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
            🍽️ მენიუ
          </button>
        )}
        <button onClick={() => setTab('couriers')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'couriers' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          🏍️ კურიერები
        </button>
        <button onClick={() => setTab('stats')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${tab === 'stats' ? 'bg-white/[0.14] border-white/20 text-white' : 'bg-white/[0.04] border-transparent text-white/40'}`}>
          📊 სტატ.
        </button>
      </div>

      {tab === 'menu' ? (
        <div className="relative z-10 flex-1 px-4 pb-10 max-w-4xl mx-auto w-full pt-4">
          <MenuTab user={currentUser} />
        </div>
      ) : tab === 'couriers' ? (
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
