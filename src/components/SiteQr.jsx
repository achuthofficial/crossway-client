import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import qrcode from 'qrcode-generator';
import { Icon } from '../ui.jsx';
import { useMotion } from '../motion';
import { OUTLETS } from '../store.js';
import { BREAK, makePayload, manualCode, msLeft, WINDOW_S, windowAt } from '../lib/checkinQr.js';

/** QR as an SVG path (one path, crisp at any size). */
export function QrCode({ text, size = 200, label }) {
  const { n, d } = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const count = q.getModuleCount();
    let path = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (q.isDark(r, c)) path += `M${c},${r}h1v1h-1z`;
    return { n: count, d: path };
  }, [text]);
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label={label} shapeRendering="crispEdges" style={{ background: '#fff', borderRadius: 12, display: 'block' }}>
      <path d={d} fill="#000" />
    </svg>
  );
}

/** Current window for a rotating code, plus the time left on it; ticks once a second. */
function useRotatingWindow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return { w: windowAt(now), left: Math.ceil(msLeft(now) / 1000) };
}

function RotatingQr({ site, outlet, size }) {
  const m = useMotion();
  const { w, left } = useRotatingWindow();
  const code = manualCode(site, w);
  return (
    <div className="stack g8" style={{ alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={w}
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: m.effects() }}
            exit={{ opacity: 0, transition: m.effects('fast') }}
          >
            <QrCode text={makePayload(site, w)} size={size} label={`Check-in QR for ${outlet}`} />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Time left on this code: a bar that shrinks (scaleX), resetting each time the code changes. */}
      <div className="track" style={{ width: size, height: 4, flex: 'none' }} aria-hidden>
        <motion.div
          style={{ height: '100%', background: 'var(--primary)', transformOrigin: 'left', borderRadius: 2 }}
          animate={{ scaleX: left / WINDOW_S }}
          transition={m.reduced ? { duration: 0 } : { duration: 1, ease: 'linear' }}
        />
      </div>
      <span className="small muted" aria-live="off">
        Code <b style={{ letterSpacing: '.12em', color: 'var(--text)' }}>{code.slice(0, 3)} {code.slice(3)}</b> · new code in {left}s
      </span>
    </div>
  );
}

/** Client-side panel: the rotating QR that workers scan to check in, take breaks and check out. */
export function SiteQrPanel({ s }) {
  const m = useMotion();
  const [outlet, setOutlet] = useState(OUTLETS[0][0]);
  const [full, setFull] = useState(false);
  const site = OUTLETS.find(o => o[0] === outlet)[1];
  const left = s.scansLeft();
  return (
    <div className="card20" style={{ gap: 14 }}>
      <div className="row between g8 wrap">
        <div className="stack">
          <h2 className="h18">Site check-in QR</h2>
          <span className="small muted">Workers scan it to check in and out. It changes every {WINDOW_S} s, so a photo of it can't be reused.</span>
        </div>
      </div>
      <div className="row g6 wrap" role="tablist" aria-label="Outlet">
        {OUTLETS.map(([o]) => (
          <button key={o} type="button" role="tab" aria-selected={o === outlet} className={'chip' + (o === outlet ? ' on' : '')} onClick={() => setOutlet(o)}>
            {o === outlet && <Icon name="check" size={18} />}{o}
          </button>
        ))}
      </div>
      <div className="row g20 wrap" style={{ alignItems: 'flex-start' }}>
        <RotatingQr site={site} outlet={outlet} size={176} />
        <div className="stack g10" style={{ flex: 1, minWidth: 200 }}>
          {[
            ['qr_code_scanner', 'Check in', 'Inside the geofence, scan to start the shift. Billing starts at the scan.'],
            ['free_breakfast', 'Breaks', `Start and end in the app; ${s.breaks[outlet]} min allowed here.`],
            ['logout', 'Check out', 'Scan again on the way out; the timesheet comes to you.'],
          ].map(([i, h, t]) => (
            <div key={h} className="row g10 start">
              <Icon name={i} className="muted" />
              <div className="stack"><span style={{ fontSize: 14, fontWeight: 500 }}>{h}</span><span className="small muted">{t}</span></div>
            </div>
          ))}
          <div className="row g8 wrap" style={{ marginTop: 4 }}>
            <motion.button whileTap={{ scale: 0.96 }} type="button" className="btn btn-tonal md" onClick={() => setFull(true)}>
              <Icon name="fullscreen" />Show on a tablet
            </motion.button>
            <button type="button" className="btn btn-outline md" disabled={!left} onClick={() => s.simulateScan()} title="Plays the next worker scan, as the worker app would report it">
              <Icon name="play_arrow" />{left ? 'Simulate a worker scan' : 'All demo scans played'}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {full && (
          <motion.div className="scrim" style={{ zIndex: 80 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={m.effects()} onClick={() => setFull(false)}>
            <motion.div
              className="dialog"
              role="dialog"
              aria-modal="true"
              aria-label={`Check-in QR for ${outlet}`}
              style={{ alignItems: 'center', width: 'min(520px, 100%)' }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { ...m.spatial(), opacity: m.effects() } }}
              exit={{ scale: 0.96, opacity: 0, transition: m.effects('fast') }}
              onClick={e => e.stopPropagation()}
            >
              <span className="eyebrow">Saffron Table · {outlet}</span>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 400, textAlign: 'center' }}>Scan to check in or out</h2>
              <RotatingQr site={site} outlet={outlet} size={320} />
              <span className="small muted" style={{ textAlign: 'center' }}>Open the CrossWay app → Today's shift → Scan site QR</span>
              <button type="button" className="btn btn-filled" onClick={() => setFull(false)}>Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Break length per outlet. Starts at the default; the client can lengthen it but not go below it. */
export function BreakSettings({ s }) {
  const m = useMotion();
  const canEdit = ['owner', 'hr', 'site'].includes(s.role);
  const change = (o, d) => {
    const v = s.setBreak(o, s.breaks[o] + d);
    s.say(`Break at ${o} is now ${v} min. Workers see it from their next check-in.`);
  };
  return (
    <div className="card20" style={{ gap: 12 }}>
      <div className="stack">
        <h2 className="h18">Breaks</h2>
        <span className="small muted">
          Every shift over {BREAK.afterHours} h includes a {BREAK.defaultMin}-min break by default. You can give more, up to {BREAK.max} min; it can't go below {BREAK.min}.
        </span>
      </div>
      {Object.entries(s.breaks).map(([o, v]) => (
        <div key={o} className="row g12" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}>
          <div className="stack" style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{o}</span>
            <span className="xs muted">{v === BREAK.defaultMin ? 'Default' : `+${v - BREAK.defaultMin} min over the default`}</span>
          </div>
          <div className="row g4" role="group" aria-label={`Break length at ${o}`}>
            <button type="button" className="icon-btn" aria-label={`Shorter break at ${o}`} disabled={!canEdit || v <= BREAK.min} title={v <= BREAK.min ? `${BREAK.min} min is the minimum` : undefined} onClick={() => change(o, -BREAK.step)}>
              <Icon name="remove" />
            </button>
            <motion.span key={v} initial={{ scale: m.reduced ? 1 : 1.25 }} animate={{ scale: 1 }} transition={m.spatial('fast')} style={{ minWidth: 64, textAlign: 'center', fontSize: 16 }} aria-live="polite">
              {v} min
            </motion.span>
            <button type="button" className="icon-btn" aria-label={`Longer break at ${o}`} disabled={!canEdit || v >= BREAK.max} onClick={() => change(o, BREAK.step)}>
              <Icon name="add" />
            </button>
          </div>
        </div>
      ))}
      {!canEdit && <span className="xs muted">Only the Account Owner, HR or a Site Manager can change breaks.</span>}
    </div>
  );
}
