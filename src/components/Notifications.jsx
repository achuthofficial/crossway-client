import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { T } from '../data.js';
import { Icon } from '../ui.jsx';
import { useMotion } from '../motion';

const PREFS = [['in', 'Check-ins'], ['out', 'Check-outs'], ['breaks', 'Breaks and overruns']];

/** Top-bar bell: attendance notifications from site QR scans, with per-type and desktop alert settings. */
export default function Notifications({ s }) {
  const m = useMotion();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const unread = s.notes.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const close = e => {
      if (e.key === 'Escape' || (e.type === 'mousedown' && box.current && !box.current.contains(e.target))) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  const toggleOpen = () => {
    if (open) s.setNotes(l => l.map(n => ({ ...n, read: true })));
    setOpen(!open);
  };
  const setPref = (k, v) => s.setPrefs(p => ({ ...p, [k]: v }));
  const desktop = async on => {
    if (!on) return setPref('desktop', false);
    if (typeof Notification === 'undefined') return s.say("This browser doesn't support desktop alerts.");
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') {
      setPref('desktop', true);
      s.say('Desktop alerts on.');
    } else s.say('Desktop alerts are blocked in your browser settings.');
  };

  return (
    <div ref={box} style={{ position: 'relative' }}>
      <button type="button" className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} aria-expanded={open} onClick={toggleOpen}>
        <motion.span key={s.notes[0]?.key} style={{ display: 'inline-flex' }} initial={{ rotate: m.reduced || !unread ? 0 : -18 }} animate={{ rotate: 0 }} transition={m.spatial('fast')}>
          <Icon name="notifications" className={unread ? 'fill1' : ''} />
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span key="b" className="rail-badge" style={{ top: 4, right: 4 }} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={m.spatial('fast')}>
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-panel"
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { ...m.spatial('fast'), opacity: m.effects('fast') } }}
            exit={{ opacity: 0, y: -6, transition: m.effects('fast') }}
          >
            <div className="row between" style={{ padding: '4px 4px 8px' }}>
              <b style={{ fontSize: 16, fontWeight: 500 }}>Attendance</b>
              <span className="xs muted">From site QR scans</span>
            </div>
            <div className="stack" style={{ maxHeight: 340, overflow: 'auto' }}>
              {!s.notes.length && <span className="small muted" style={{ padding: 12 }}>Nothing yet today.</span>}
              <AnimatePresence initial={false}>
                {s.notes.map(n => (
                  <motion.div key={n.key} layout className="row g12 start notif-item" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={m.spatial()}>
                    <span className="icon-circle" style={{ width: 36, height: 36, borderRadius: 18, background: T[n.sev][0], color: T[n.sev][1], flex: 'none' }}>
                      <Icon name={n.icon} size={20} />
                    </span>
                    <div className="stack" style={{ flex: 1, gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                      <span className="xs muted" style={{ lineHeight: 1.4 }}>{n.body}</span>
                    </div>
                    <span className="xs muted">{n.time}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="stack g4" style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 4 }}>
              <span className="xs muted" style={{ padding: '0 4px' }}>Notify me about</span>
              {PREFS.map(([k, l]) => (
                <label key={k} className="row g8 notif-pref">
                  <input type="checkbox" checked={s.prefs[k]} onChange={e => setPref(k, e.target.checked)} />{l}
                </label>
              ))}
              <label className="row g8 notif-pref">
                <input type="checkbox" checked={s.prefs.desktop} onChange={e => desktop(e.target.checked)} />Desktop alerts (even when this tab is in the background)
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
