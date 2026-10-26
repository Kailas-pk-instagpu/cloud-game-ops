import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useAuthStore } from '@/shared/lib/store';
import { consumeLoginWelcome } from '@/shared/lib/loginWelcome';
import { ROLE_LABELS, type User } from '@/shared/types/auth';

const AUTO_DISMISS_MS = 5000;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Shown once per successful sign-in: confirms who is logged in,
 * closes itself after AUTO_DISMISS_MS, or sooner via the close button / Escape.
 */
export function LoginWelcomePopup() {
  const user = useAuthStore((s) => s.user);
  const [shown, setShown] = useState<User | null>(() => consumeLoginWelcome());
  const reduceMotion = useReducedMotion() ?? false;

  const close = useCallback(() => setShown(null), []);

  useEffect(() => {
    if (!shown) return;
    const timer = window.setTimeout(close, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [shown, close]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown, close]);

  // Signing out (or the session dropping) hides it immediately.
  useEffect(() => {
    if (!user && shown) close();
  }, [user, shown, close]);

  return (
    <AnimatePresence initial={false}>
      {shown && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label={`Signed in as ${shown.name}`}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -12 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -8 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: 'spring', stiffness: 420, damping: 32, mass: 0.7, opacity: { duration: 0.16 } }
          }
          className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4"
        >
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card ring-1 ring-inset ring-primary/15">
            <div className="flex items-start gap-3 p-4">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl gradient-primary flex items-center justify-center">
                {shown.avatar ? (
                  <img src={shown.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary-foreground">{initials(shown.name)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Signed in
                </div>
                <p className="mt-0.5 truncate text-base font-semibold leading-tight text-foreground">{shown.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    {ROLE_LABELS[shown.role]}
                  </span>
                  <span className="truncate text-[11.5px] text-muted-foreground">{shown.email}</span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close welcome message"
                onClick={close}
                className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-0.5 w-full bg-muted">
              <div className="h-full w-full gradient-primary animate-welcome-countdown" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
