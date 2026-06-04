import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useNotificationStore } from '@/shared/lib/store';

type ToastNotification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
};

const TYPE_ICON = {
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-warning" />,
  success: <CheckCircle className="h-4 w-4 text-success" />,
  info: <Info className="h-4 w-4 text-info" />,
} as const;

const TYPE_BG = {
  error: 'bg-destructive/15',
  warning: 'bg-warning/15',
  success: 'bg-success/15',
  info: 'bg-info/15',
} as const;

const AUTO_DISMISS_MS = 5000;

interface Props {
  anchorRef: RefObject<HTMLElement>;
  onCollapse?: () => void;
}

export function DynamicIslandToasts({ anchorRef, onCollapse }: Props) {
  const lastIncoming = useNotificationStore((s) => s.lastIncoming);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [anchor, setAnchor] = useState<{ x: number; y: number; vw: number } | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  // Measure anchor position (bell icon) and keep updated on resize/scroll
  useEffect(() => {
    const measure = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Use document.documentElement.clientWidth so the scrollbar is excluded
      const vw = document.documentElement.clientWidth;
      setAnchor({ x: r.right, y: r.bottom, vw });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorRef]);

  // Push incoming notification onto the stack
  useEffect(() => {
    if (!lastIncoming) return;
    if (seenRef.current.has(lastIncoming.id)) return;
    seenRef.current.add(lastIncoming.id);
    const t: ToastNotification = {
      id: lastIncoming.id,
      title: lastIncoming.title,
      message: lastIncoming.message,
      type: lastIncoming.type,
      timestamp: lastIncoming.timestamp,
    };
    setToasts((cur) => [...cur, t]);
    const timer = window.setTimeout(() => {
      setToasts((cur) => cur.filter((x) => x.id !== t.id));
      onCollapse?.();
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [lastIncoming, onCollapse]);

  const dismiss = (id: string) => {
    setToasts((cur) => cur.filter((x) => x.id !== id));
    onCollapse?.();
  };

  if (!anchor) return null;

  // Anchor stack's right edge to the bell's right edge, so it never overflows
  const right = Math.max(8, anchor.vw - anchor.x);
  const top = anchor.y + 8;
  const maxWidth = Math.min(340, anchor.vw - right - 8);

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed z-[60] flex flex-col gap-2"
      style={{ top, right, width: maxWidth }}
    >

      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, scale: 0.2, y: -28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.2, y: -28, filter: 'blur(8px)' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 28,
              mass: 0.9,
              opacity: { duration: 0.18 },
              filter: { duration: 0.22 },
            }}
            style={{ transformOrigin: 'top right', willChange: 'transform, opacity, filter' }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 px-3 py-2.5 shadow-[0_8px_30px_-12px_hsl(var(--foreground)/0.35)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TYPE_BG[t.type]}`}>
                {TYPE_ICON[t.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{t.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{t.timestamp}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">{t.message}</p>
              </div>
              <button
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
