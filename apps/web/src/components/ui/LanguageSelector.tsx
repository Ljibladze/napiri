'use client';

import { useState } from 'react';
import { LANGS } from '@/lib/translations';
import { useLang } from '@/contexts/LanguageContext';

export function LanguageSelector() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all active:scale-95 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08]"
        aria-label="Select language"
      >
        <span className={`fi fi-${current.fi} text-lg rounded-sm`} />
        <span className="text-white/40 text-[10px] leading-none">▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden shadow-dark-lg animate-fade-in surface-elevated min-w-[56px]">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={[
                  'w-full flex items-center justify-center py-3 transition-all',
                  lang === l.code
                    ? 'bg-white/[0.15]'
                    : 'hover:bg-white/[0.07]',
                ].join(' ')}
                title={l.label}
              >
                <span className={`fi fi-${l.fi} text-2xl rounded-sm`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
