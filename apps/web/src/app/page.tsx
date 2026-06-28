'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WaveBackground } from '@/components/layout/WaveBackground';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLang } from '@/contexts/LanguageContext';

const PREVIEW = [
  { emoji: '🏛️', nameKey: 'ოლიმპოსი', coverClass: 'grad-olympos',  delay: '[animation-delay:0.1s]' },
  { emoji: '🌊', nameKey: 'ბლუ ბეი',   coverClass: 'grad-bluebay',  delay: '[animation-delay:0.2s]' },
  { emoji: '🏖️', nameKey: 'სანაპირო', coverClass: 'grad-sanapiro', delay: '[animation-delay:0.3s]' },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [loungeId, setLoungeId] = useState('');
  const [focused, setFocused] = useState(false);

  function handleGo() {
    const id = loungeId.trim();
    if (!id) return;
    router.push(`/lounge/${id}`);
  }

  return (
    <main className="relative flex flex-col items-center justify-center px-5 py-10 overflow-hidden min-h-dvh">
      <WaveBackground />

      {/* Language selector — top right */}
      <div className="fixed top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 animate-fade-in">

        {/* ── Brand ───────────────────────────────── */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-ocean-600/30 blur-3xl scale-[2.5]" />
            <span className="text-[88px] leading-none animate-emoji select-none relative z-10">🌊</span>
          </div>

          <h1 className="text-clamp-brand font-black leading-none tracking-tight gradient-text">
            ნაპირი
          </h1>

          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
            <p className="text-white/40 text-xs font-semibold tracking-[0.2em] uppercase">
              Kobuleti Beach
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>

        {/* ── Lounger input card ───────────────────── */}
        <div className="w-full glass-card rounded-3xl p-6 space-y-5 shadow-ocean-lg">

          <div className="text-center space-y-1">
            <p className="text-white font-bold text-lg">{t('beach_q')}</p>
            <p className="text-white/40 text-sm">{t('lounger_hint')}</p>
          </div>

          {/* Input */}
          <div className={[
            'relative rounded-2xl overflow-hidden transition-all duration-300 bg-white/5',
            focused
              ? 'ring-2 ring-ocean-600 shadow-ocean'
              : 'border border-white/[0.08]',
          ].join(' ')}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl select-none pointer-events-none">🏖️</span>
            <input
              type="number"
              min="1"
              max="999"
              value={loungeId}
              onChange={(e) => setLoungeId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGo()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('lounger_ph')}
              className="w-full bg-transparent pl-14 pr-4 py-5 text-white text-4xl font-black text-center placeholder-white/15 focus:outline-none tracking-widest"
            />
          </div>

          {/* CTA */}
          <button
            onClick={handleGo}
            disabled={!loungeId.trim()}
            className={[
              'w-full py-4 rounded-2xl font-black text-lg text-white transition-all duration-300 active:scale-[0.97]',
              loungeId.trim()
                ? 'bg-btn-sand shadow-sand'
                : 'bg-white/[0.08] opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            {loungeId.trim() ? t('view_menu') : t('enter_number')}
          </button>
        </div>

        {/* ── Restaurant preview ───────────────────── */}
        <div className="w-full space-y-3">
          <p className="text-center text-white/25 text-xs font-semibold uppercase tracking-widest">
            {t('restaurants_badge')}
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {PREVIEW.map((r, i) => (
              <div
                key={r.nameKey}
                className={`glass-card rounded-2xl p-3 flex flex-col items-center gap-2 text-center animate-fade-in ${r.delay}`}
              >
                <div className={`${r.coverClass} w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow-card`}>
                  {r.emoji}
                </div>
                <p className="text-white font-bold text-xs leading-tight">{r.nameKey}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs text-center">{t('qr_hint')}</p>
      </div>
    </main>
  );
}
