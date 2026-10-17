import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'motion/react';
import { T } from './data.js';

export const Icon = ({ name, size, style, className = '' }) => (
  <span className={'icon ' + className} style={size ? { fontSize: size, ...style } : style} aria-hidden="true">
    {name}
  </span>
);

/** Action button. kind: 'p' primary, 'd' danger, default outline. */
export function Act({ label, on, kind, size = 'sm', disabled }) {
  const cls = kind === 'p' ? 'btn-filled' : kind === 'd' ? 'btn-danger' : kind === 't' ? 'btn-tonal' : 'btn-outline';
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      className={`btn ${size} ${cls}`}
      onClick={on}
      disabled={disabled}
    >
      {label}
    </motion.button>
  );
}

export const Tag = ({ sev, children, lg }) => (
  <span className={'tag' + (lg ? ' lg' : '')} style={{ background: T[sev][0], color: T[sev][1] }}>
    {children}
  </span>
);

export const PageHead = ({ eyebrow, title, lead, children }) => (
  <div className="row between end wrap g16">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="h1">{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </div>
    {children}
  </div>
);

/* ---------- motion presets ---------- */
export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

export const Stagger = ({ as = 'div', children, className, style }) => {
  const C = motion[as];
  return (
    <C className={className} style={style} variants={listVariants} initial="hidden" animate="show">
      {children}
    </C>
  );
};

/** Animated progress fill that grows from 0 to `width` when scrolled into view. */
export function Fill({ width, color, delay = 0 }) {
  return (
    <motion.div
      style={{ background: color, height: '100%', borderRadius: 'inherit' }}
      initial={{ width: 0 }}
      animate={{ width }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}
    />
  );
}

/**
 * Counts up to the numeric part of a display value like "₹2.84 Cr", "91.4%" or "6,410",
 * keeping the prefix/suffix and number formatting.
 */
export function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const m = String(value).match(/^([^\d−-]*)([\d,]*\.?\d+)(.*)$/);
  const [text, setText] = useState(m ? m[1] + '0' + m[3] : value);

  useEffect(() => {
    if (!m || !inView) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = (num.split('.')[1] || '').length;
    const grouped = num.includes(',');
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: v => {
        const n = grouped
          ? Math.round(v).toLocaleString('en-IN')
          : v.toFixed(decimals);
        setText(pre + n + post);
      },
    });
    return () => controls.stop();
  }, [value, inView]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span ref={ref}>{m ? text : value}</span>;
}

export const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);
