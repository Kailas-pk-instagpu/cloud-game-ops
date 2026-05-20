import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

const iosEase = [0.32, 0.72, 0, 1] as const;

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.997 }}
        transition={{ duration: reduce ? 0.18 : 0.32, ease: iosEase }}
        style={{ willChange: "transform, opacity" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
