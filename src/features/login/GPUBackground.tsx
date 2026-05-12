// Login background — large soft glowing arc on the left, deep dark canvas.
// Themed with the app's primary/gradient tokens. Pure CSS for smoothness.
export default function GPUBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[hsl(222_47%_3%)]">
      {/* Deep base wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222_47%_3%)] via-[hsl(232_47%_5%)] to-[hsl(262_50%_4%)]" />

      {/* Primary glowing arc (left) */}
      <div className="login-arc login-arc-primary" />
      {/* Secondary inner glow for depth */}
      <div className="login-arc login-arc-inner" />
      {/* Soft accent glow (bottom-right) for balance */}
      <div className="login-arc login-arc-accent" />

      {/* Subtle grid + vignette */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(222_47%_2%/0.9)_100%)]" />
    </div>
  );
}
