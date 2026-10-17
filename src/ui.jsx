import { motion } from 'motion/react';
import { T } from './data.js';
import { CountUp, StaggerList, staggerItem, useMotion } from './motion';

export { CountUp };

export const Icon = ({ name, size, style, className = '' }) => (
  <span className={'icon ' + className} style={size ? { fontSize: size, ...style } : style} aria-hidden="true">
    {name}
  </span>
);

/** Action button. kind: 'p' primary, 'd' danger, 't' tonal, default outline. */
export function Act({ label, on, kind, size = 'sm', disabled }) {
  const m = useMotion();
  const cls = kind === 'p' ? 'btn-filled' : kind === 'd' ? 'btn-danger' : kind === 't' ? 'btn-tonal' : 'btn-outline';
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} transition={m.spatial('fast')} className={`btn ${size} ${cls}`} onClick={on} disabled={disabled}>
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

/* Variants shared by staggered lists; timing comes from the active MotionProvider scheme. */
export const itemVariants = staggerItem;
export const listVariants = { hidden: {}, show: {} };

export const Stagger = ({ as = 'div', className, style, children }) => (
  <StaggerList as={as} className={className} style={style}>{children}</StaggerList>
);

/**
 * Progress fill that grows from the left. Animates `scaleX` (a transform), not width,
 * so it never triggers layout.
 */
export function Fill({ width, color, delay = 0 }) {
  const m = useMotion();
  const pct = Math.max(0, Math.min(100, parseFloat(width))) / 100;
  return (
    <motion.div
      style={{ background: color, height: '100%', width: '100%', borderRadius: 'inherit', transformOrigin: 'left center' }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: pct }}
      transition={{ ...m.spatial('slow'), delay: m.reduced ? 0 : delay }}
    />
  );
}

export const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2);
