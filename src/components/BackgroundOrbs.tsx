export function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Ruby red orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: '50vw',
          height: '50vw',
          top: '10%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.06) 0%, transparent 60%)',
          filter: 'blur(80px)',
          animation: 'orbDrift1 20s ease-in-out infinite',
          opacity: 0.15,
        }}
      />
      {/* Sapphire blue orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: '40vw',
          height: '40vw',
          top: '50%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%)',
          filter: 'blur(70px)',
          animation: 'orbDrift2 24s ease-in-out infinite',
          opacity: 0.15,
        }}
      />
      {/* Purple orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: '30vw',
          height: '30vw',
          bottom: '10%',
          left: '30%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'orbDrift3 18s ease-in-out infinite',
          opacity: 0.15,
        }}
      />
    </div>
  );
}
