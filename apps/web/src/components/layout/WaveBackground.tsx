export function WaveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep ocean gradient base */}
      <div className="absolute inset-0 bg-ocean-base" />

      {/* Top-left atmospheric glow */}
      <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full wave-glow-left" />

      {/* Right glow */}
      <div className="absolute top-1/4 -right-48 w-[600px] h-[600px] rounded-full wave-glow-right" />

      {/* Warm accent glow bottom */}
      <div className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full wave-glow-warm" />

      {/* Center shimmer line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px wave-shimmer-line" />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] wave-noise" />

      {/* Bubbles */}
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={`bubble bubble-${i}`} />
      ))}

      {/* Wave layers */}
      <div className="absolute bottom-0 left-0 right-0 h-56 overflow-hidden">
        <svg className="absolute bottom-0 w-[200%] animate-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C180,100 360,20 540,60 C720,100 900,20 1080,60 C1260,100 1440,20 1440,60 L1440,120 L0,120 Z" fill="rgba(0,180,216,0.14)" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] animate-wave-slow" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" fill="rgba(0,150,199,0.10)" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] animate-wave-slower" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,70 C360,35 720,105 1080,70 C1260,52 1350,68 1440,70 L1440,120 L0,120 Z" fill="rgba(0,119,182,0.12)" />
        </svg>
      </div>
    </div>
  );
}
