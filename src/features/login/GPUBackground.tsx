// Smooth CSS aurora background — themed with the app's primary/gradient tokens.
// No WebGL: stays buttery smooth on all devices and respects reduced-motion.
export default function GPUBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[hsl(var(--background))]">
      {/* Deep base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222_47%_4%)] via-[hsl(232_47%_6%)] to-[hsl(262_50%_5%)]" />

      {/* Aurora blobs */}
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />

      {/* Subtle grid + vignette */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(222_47%_3%/0.85)_100%)]" />
    </div>
  );
}
