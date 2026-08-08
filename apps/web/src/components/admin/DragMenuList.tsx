'use client';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';

// ── Drag handle icon ──────────────────────────────────────
function DragHandle(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="touch-none cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 shrink-0 select-none px-1 leading-none transition-colors"
      aria-label="გადაათრიე"
    >
      ⠿
    </button>
  );
}

// ── Sortable menu item row ────────────────────────────────
function SortableItemRow({
  item,
  onEdit,
  onDelete,
  deletingId,
}: {
  item: any;
  onEdit: (i: any) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white/[0.05] border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3 ${isDragging ? 'opacity-40 shadow-2xl' : ''}`}
    >
      <DragHandle {...attributes} {...listeners} />
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/[0.07] border border-white/[0.08] flex items-center justify-center shrink-0">
        {item.imageUrl
          ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
          : <span className="text-2xl">{item.emoji}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${item.special ? 'text-amber-300' : 'text-white'}`}>
          {item.name}
          {item.special && (
            <span className="ml-1.5 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/20 rounded-full px-1.5 py-0.5">⭐</span>
          )}
        </p>
        {item.description && <p className="text-white/35 text-xs truncate">{item.description}</p>}
        <p className="text-emerald-300 font-black text-sm mt-0.5">₾{item.price}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.06] border border-white/[0.10] text-white/70 active:scale-95 transition-all"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={deletingId === item.id}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-600/30 border border-red-500/20 text-red-300 active:scale-95 transition-all disabled:opacity-50"
        >
          {deletingId === item.id ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  );
}

// ── Sortable category section ─────────────────────────────
function SortableCategorySection({
  cat,
  catItems,
  onEdit,
  onDelete,
  deletingId,
  renamingCat,
  renameVal,
  setRenameVal,
  onStartRename,
  onConfirmRename,
  onCancelRename,
}: {
  cat: string;
  catItems: any[];
  onEdit: (i: any) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  renamingCat: string | null;
  renameVal: string;
  setRenameVal: (v: string) => void;
  onStartRename: (c: string) => void;
  onConfirmRename: (c: string) => void;
  onCancelRename: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `cat:${cat}` });

  const itemIds = catItems.map((i) => i.id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : ''}
    >
      {/* Category header */}
      <div className="flex items-center gap-1.5 mb-2">
        <DragHandle {...attributes} {...listeners} />
        {renamingCat === cat ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirmRename(cat);
                if (e.key === 'Escape') onCancelRename();
              }}
              autoFocus
              className="flex-1 bg-white/[0.08] border border-ocean-500/40 rounded-lg px-2 py-1 text-white text-xs font-bold focus:outline-none"
            />
            <button onClick={() => onConfirmRename(cat)} className="text-xs px-2 py-1 rounded-lg bg-ocean-600/60 text-white font-bold">✓</button>
            <button onClick={onCancelRename} className="text-xs px-2 py-1 rounded-lg bg-white/[0.08] text-white/50 font-bold">✕</button>
          </div>
        ) : (
          <>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider flex-1">{cat}</p>
            <button
              onClick={() => onStartRename(cat)}
              className="px-2 py-1 rounded-lg bg-white/[0.07] border border-white/[0.10] text-white/60 text-xs active:scale-95 transition-all"
            >
              ✏️
            </button>
          </>
        )}
      </div>

      {/* Items */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 pl-5">
          {catItems.map((item) => (
            <SortableItemRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingId={deletingId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Exported component ────────────────────────────────────
interface Props {
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export function DragMenuList({ items, setItems, onEdit, onDelete, deletingId }: Props) {
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const sorted = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const cats = [...new Set(sorted.map((i) => i.category))] as string[];
  const catIds = cats.map((c) => `cat:${c}`);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeStr = String(active.id);
    const overStr = String(over.id);

    if (activeStr.startsWith('cat:') && overStr.startsWith('cat:')) {
      // ── Category reorder ──
      const activeCat = activeStr.slice(4);
      const overCat = overStr.slice(4);
      const oldIdx = cats.indexOf(activeCat);
      const newIdx = cats.indexOf(overCat);
      if (oldIdx === -1 || newIdx === -1) return;

      const newCats = arrayMove(cats, oldIdx, newIdx);
      const lo = Math.min(oldIdx, newIdx);
      const hi = Math.max(oldIdx, newIdx);

      const updates: Promise<any>[] = [];
      for (let i = lo; i <= hi; i++) {
        const c = newCats[i];
        sorted.filter((x) => x.category === c).forEach((x, j) => {
          updates.push(api.menu.update(x.id, { sortOrder: i * 1000 + j * 10 }));
        });
      }
      const results = await Promise.all(updates);
      setItems((prev) => prev.map((i) => results.find((r) => r.id === i.id) ?? i));
    } else if (!activeStr.startsWith('cat:') && !overStr.startsWith('cat:')) {
      // ── Item reorder within category ──
      const activeItem = sorted.find((i) => i.id === activeStr);
      const overItem = sorted.find((i) => i.id === overStr);
      if (!activeItem || !overItem || activeItem.category !== overItem.category) return;

      const catItems = sorted.filter((i) => i.category === activeItem.category);
      const catIdx = cats.indexOf(activeItem.category);
      const oldIdx = catItems.findIndex((i) => i.id === activeStr);
      const newIdx = catItems.findIndex((i) => i.id === overStr);

      const newCatItems = arrayMove(catItems, oldIdx, newIdx);
      const results = await Promise.all(
        newCatItems.map((item, i) =>
          api.menu.update(item.id, { sortOrder: catIdx * 1000 + i * 10 }),
        ),
      );
      setItems((prev) => prev.map((i) => results.find((r) => r.id === i.id) ?? i));
    }
  }

  async function handleRenameCategory(oldName: string) {
    if (!renameVal.trim()) { setRenamingCat(null); return; }
    for (const item of items.filter((i) => i.category === oldName)) {
      const updated = await api.menu.update(item.id, { category: renameVal.trim() });
      setItems((p) => p.map((i) => (i.id === updated.id ? updated : i)));
    }
    setRenamingCat(null);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={catIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-5">
          {cats.map((cat) => (
            <SortableCategorySection
              key={cat}
              cat={cat}
              catItems={sorted.filter((i) => i.category === cat)}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingId={deletingId}
              renamingCat={renamingCat}
              renameVal={renameVal}
              setRenameVal={setRenameVal}
              onStartRename={(c) => { setRenamingCat(c); setRenameVal(c); }}
              onConfirmRename={handleRenameCategory}
              onCancelRename={() => setRenamingCat(null)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
