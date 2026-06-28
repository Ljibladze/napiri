'use client';

import type { RestaurantSummary } from '@/types';
import { useLang } from '@/contexts/LanguageContext';

interface RestaurantGridProps {
  restaurants: RestaurantSummary[];
  onSelect: (restaurant: RestaurantSummary) => void;
  activeRestaurantId?: string | null;
}

export function RestaurantGrid({ restaurants, onSelect, activeRestaurantId }: RestaurantGridProps) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-4">
      {restaurants.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className="group w-full text-left rounded-3xl overflow-hidden scroll-reveal active:scale-[0.98] transition-transform duration-150 shadow-card"
        >
          {/* ── Gradient header ─────────────────────── */}
          <div className={`${r.coverClass} relative h-52 flex items-center justify-center overflow-hidden`}>
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/[0.12]" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-black/[0.12]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 rounded-full bg-white/[0.06] blur-2xl" />

            {/* Big emoji */}
            <span className="relative z-10 text-[90px] leading-none select-none group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              {r.emoji}
            </span>

            {/* Rating badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.15]">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-white text-xs font-bold">{r.rating}</span>
            </div>

            {/* Active / cart badge */}
            {activeRestaurantId === r.id && (
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-white text-xs font-bold">
                🛒 {t('cart')}
              </div>
            )}
          </div>

          {/* ── Content panel ───────────────────────── */}
          <div className="card-panel px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black text-white leading-tight">{r.name}</h2>
                <p className="text-white/50 text-sm mt-0.5 truncate">{r.description}</p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  {r.tags.map((tag) => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                  <span className="tag-pill">🕐 {r.deliveryTime}</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-black bg-white/[0.12] border border-white/[0.15] group-hover:scale-110 group-hover:bg-white/[0.2] transition-all duration-300">
                <span className="group-hover:translate-x-0.5 transition-transform inline-block">›</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
