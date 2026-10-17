import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, AnimatePresence, motion, useInView, useMotionValue, useTransform, type HTMLMotionProps } from 'motion/react';
import { tokens } from '../../design-tokens/tokens';
import { LOADING_SEQUENCE, mix, pathFromRadii } from '../../design-tokens/shapes';
import { useMotion } from './MotionProvider';

/* ------------------------------------------------------------------ */
/* StaggerList: children enter one after another (30–50 ms, max 8).   */
/* ------------------------------------------------------------------ */
export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

type StaggerListProps = { as?: 'div' | 'ul' | 'tbody'; className?: string; style?: CSSProperties; children: ReactNode };

export function StaggerList({ as = 'div', className, style, children }: StaggerListProps) {
  const m = useMotion();
  const C = motion[as];
  return (
    <C
      className={className}
      style={style}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: m.reduced ? 0 : tokens.stagger.interval / 1000, delayChildren: 0.04 } } }}
    >
      {children}
    </C>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedCard: spring entrance, hover lift with elevation that only  */
/* animates transform + opacity (the shadow layer fades, it is never   */
/* re-painted).                                                         */
/* ------------------------------------------------------------------ */
type AnimatedCardProps = HTMLMotionProps<'div'> & { lift?: boolean; interactive?: boolean };

export function AnimatedCard({ lift = true, interactive = false, children, style, ...rest }: AnimatedCardProps) {
  const m = useMotion();
  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={m.spatial()}
      whileHover={lift ? 'hover' : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      style={{ position: 'relative', ...style }}
      {...rest}
    >
      {lift && (
        <motion.span
          aria-hidden
          className="m-elevation"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 0 }, hover: { opacity: 1 } }}
          transition={m.effects('fast')}
        />
      )}
      {children as ReactNode}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* SharedElement: same `id` on two screens morphs between them.        */
/* ------------------------------------------------------------------ */
type SharedElementProps = HTMLMotionProps<'div'> & { id: string };
export function SharedElement({ id, transition, ...rest }: SharedElementProps) {
  const m = useMotion();
  return <motion.div layoutId={id} transition={transition ?? m.spatial()} {...rest} />;
}

/* ------------------------------------------------------------------ */
/* CountUp: animates the numeric part of "₹2.84 Cr", "91.4%", "6,410". */
/* ------------------------------------------------------------------ */
export function CountUp({ value }: { value: string | number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const m = useMotion();
  const match = String(value).match(/^([^\d−-]*)([\d,]*\.?\d+)(.*)$/);
  const [text, setText] = useState(match ? match[1] + '0' + match[3] : String(value));

  useEffect(() => {
    if (!match) return;
    const [, pre, num, post] = match;
    if (m.reduced) return setText(String(value));
    if (!inView) return;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = (num.split('.')[1] || '').length;
    const grouped = num.includes(',');
    const controls = animate(0, target, {
      // Expressive products get a 900 ms reveal; the standard (admin) scheme stays within its 300 ms budget.
      duration: m.scheme === 'standard' ? tokens.duration.adminMax / 1000 : tokens.duration.long / 1000 + 0.4,
      ease: [...tokens.easing.emphasizedDecelerate],
      onUpdate: v => setText(pre + (grouped ? Math.round(v).toLocaleString('en-IN') : v.toFixed(decimals)) + post),
    });
    return () => controls.stop();
  }, [value, inView, m.reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={ref} aria-label={String(value)}>
      <span aria-hidden>{match ? text : value}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ShapeMorph: M3 Expressive loading indicator. Morphs through the     */
/* token loading sequence while rotating. Purely decorative for AT.    */
/* ------------------------------------------------------------------ */
export function ShapeMorph({ size = 24, color = 'currentColor', playing = true }: { size?: number; color?: string; playing?: boolean }) {
  const m = useMotion();
  const progress = useMotionValue(0);
  const seq = LOADING_SEQUENCE;
  const d = useTransform(progress, p => {
    const i = Math.floor(p) % seq.length;
    const t = p - Math.floor(p);
    // Ease each segment so shapes rest briefly before morphing on.
    const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    return pathFromRadii(mix(seq[i], seq[(i + 1) % seq.length], e), size, p * 0.9);
  });
  useEffect(() => {
    if (!playing || m.reduced) return;
    const controls = animate(progress, [0, seq.length], { duration: seq.length * 0.65, ease: 'linear', repeat: Infinity });
    return () => controls.stop();
  }, [playing, m.reduced, progress, seq.length]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
      <motion.path d={d} fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* MorphButton: pill → loading shape → check (or error).               */
/* The container resizes with a layout (transform) animation.          */
/* ------------------------------------------------------------------ */
export type MorphState = 'idle' | 'loading' | 'success' | 'error';

type MorphButtonProps = {
  state: MorphState;
  label: ReactNode;
  successLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function MorphButton({ state, label, successLabel = 'Done', onClick, disabled, className = '', style }: MorphButtonProps) {
  const m = useMotion();
  const compact = state === 'loading' || state === 'success';
  return (
    <motion.button
      type="button"
      layout
      transition={m.spatial('fast')}
      className={`m-morph ${className} ${compact ? 'is-compact' : ''} is-${state}`}
      style={{ borderRadius: compact ? 999 : undefined, ...style }}
      onClick={state === 'idle' || state === 'error' ? onClick : undefined}
      disabled={disabled}
      aria-busy={state === 'loading'}
      aria-live="polite"
      whileTap={state === 'idle' ? { scale: 0.96 } : undefined}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {state === 'loading' ? (
          <motion.span key="l" className="m-morph-inner" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={m.effects('fast')}>
            <ShapeMorph size={22} color="currentColor" />
            <span className="sr-only">Working…</span>
          </motion.span>
        ) : state === 'success' ? (
          <motion.span key="s" className="m-morph-inner" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={m.spatial('fast')}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...m.effects(), delay: 0.05 }} />
            </svg>
            <span className="sr-only">{successLabel}</span>
          </motion.span>
        ) : (
          <motion.span key="i" className="m-morph-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={m.effects('fast')}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* SuccessBurst: one-shot particle burst in brand colours.             */
/* Transform + opacity only, no flashing, skipped for reduced motion.  */
/* ------------------------------------------------------------------ */
export function SuccessBurst({ trigger, count = 18, radius = 90, style }: { trigger: unknown; count?: number; radius?: number; style?: CSSProperties }) {
  const m = useMotion();
  const [bursts, setBursts] = useState<number[]>([]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (m.reduced || trigger === undefined || trigger === null || trigger === false) return;
    const id = Date.now();
    setBursts(b => [...b, id]);
    const t = setTimeout(() => setBursts(b => b.filter(x => x !== id)), 1100);
    return () => clearTimeout(t);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="m-burst" style={style} aria-hidden>
      {bursts.map(id =>
        Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2 + (id % 7) * 0.1;
          const r = radius * (0.6 + ((i * 37) % 10) / 25);
          const color = tokens.color.brand[i % tokens.color.brand.length];
          return (
            <motion.span
              key={id + '-' + i}
              className="m-burst-dot"
              style={{ background: color, borderRadius: i % 3 === 0 ? 2 : 999 }}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
              animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r + 24, scale: 1, opacity: 0, rotate: i * 40 }}
              transition={{ duration: 0.9, ease: [...tokens.easing.emphasizedDecelerate] }}
            />
          );
        }),
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SkeletonShimmer: shimmer placeholder that crossfades into content.  */
/* ------------------------------------------------------------------ */
type SkeletonProps = { loading: boolean; lines?: number; height?: number; children: ReactNode; style?: CSSProperties };

export function SkeletonShimmer({ loading, lines = 4, height = 56, children, style }: SkeletonProps) {
  const m = useMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {loading ? (
        <motion.div key="sk" className="m-skeleton" style={style} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={m.effects('fast')} aria-busy="true" aria-label="Loading">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="m-skeleton-row" style={{ height }}>
              <span className="m-skeleton-dot" />
              <span className="m-skeleton-bars">
                <span className="m-skeleton-bar" style={{ width: `${60 - (i % 3) * 12}%` }} />
                <span className="m-skeleton-bar short" style={{ width: `${36 + (i % 2) * 14}%` }} />
              </span>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={m.effects()}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Simulated first-load latency for a static demo so skeletons are visible once per screen. */
const seen = new Set<string>();
export function useFirstLoad(key: string, ms = 650) {
  const [loading, setLoading] = useState(!seen.has(key));
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => { seen.add(key); setLoading(false); }, ms);
    return () => clearTimeout(t);
  }, [key, loading, ms]);
  return loading;
}

/* ------------------------------------------------------------------ */
/* IconMorph: crossfade + rotate between two icons (approve/reject).   */
/* ------------------------------------------------------------------ */
export function IconMorph({ icon, color, size = 20 }: { icon: string; color?: string; size?: number }) {
  const m = useMotion();
  return (
    <span style={{ display: 'inline-grid', width: size, height: size, placeItems: 'center' }} aria-hidden>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={icon}
          className="icon"
          style={{ fontSize: size, color, gridArea: '1/1' }}
          initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
          transition={m.spatial('fast')}
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
