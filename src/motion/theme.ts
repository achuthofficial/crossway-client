import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const KEY = 'crossway-theme';
const read = (): ThemeMode | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
};
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

/**
 * Light/dark theme following the OS unless the viewer picks one. The switch uses the
 * View Transitions API (where supported) for a circular reveal from the toggle, which
 * shows where the change came from; reduced motion gets an instant switch.
 */
/** `durationMs` sets the reveal length: 450 ms by default, the admin passes its 300 ms budget. */
export function useTheme(durationMs = 450) {
  const [mode, setMode] = useState<ThemeMode>(() => read() ?? (systemDark() ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset.theme = next;
      setMode(next);
      try { localStorage.setItem(KEY, next); } catch { /* storage may be blocked */ }
    };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || reduce) return apply();
    const vt = doc.startViewTransition(apply);
    const x = origin?.x ?? innerWidth - 40;
    const y = origin?.y ?? 40;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: durationMs, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
  }, [mode, durationMs]);

  return { mode, toggle };
}
