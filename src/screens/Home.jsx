import { AnimatePresence, motion } from 'motion/react';
import { AV, T } from '../data.js';
import { CountUp, Fill, Icon, itemVariants, Stagger } from '../ui.jsx';
import { useMotion } from '../motion';

export default function Home({ s }) {
  const m = useMotion();
  const onSite = s.live.filter(w => w.status === 'On site').length;
  const openTs = s.ts.filter(t => !t.done && !t.locked).length;

  const setup = [
    ['Company verified', 'GSTIN and PAN matched', true],
    ['Outlets added', '3 outlets', true],
    ['Rate card accepted', 'Accepted 6 Oct', true],
    ['Service agreement', 'Aadhaar e-Sign', s.effAcct !== 'esign'],
    ['Invite your team', '4 people', true],
  ];
  const setupDone = setup.filter(x => x[2]).length;

  const tiles = [
    ['Book staff', 'add_circle', 'Book in 2 minutes', 'book', 'var(--brand)', 'var(--on-brand)'],
    [String(s.live.filter(w => w.sev === 'bad' || w.sev === 'warn').length), 'sensors', 'Need attention on site', 'live', 'var(--bad-bg)', 'var(--bad-fg)'],
    [String(openTs), 'fact_check', 'Timesheets to approve', 'timesheets', 'var(--warn-bg)', 'var(--warn-fg)'],
    ['₹2,14,720', 'receipt_long', 'Outstanding · 1 overdue', 'invoices', 'var(--surface-2)', 'var(--text)'],
  ];

  const pools = [
    ['Weekend crew', '5 workers · avg 4.8★', ['RK', 'SK', 'DR', 'AT', 'FK'], { role: 'waiter', count: 5, date: 'd3' }],
    ['Diwali kitchen team', '8 workers · kitchen + steward', ['AT', 'SK', 'MS'], { role: 'kitchen', count: 8, date: 'd4' }],
  ];

  const esign = () => {
    s.setEsignDone(true);
    s.say('Agreement signed. Booking unlocked.');
  };

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 400, lineHeight: '40px' }}>Good afternoon, Neha</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 15 }}>
          Saturday 18 October · 3 outlets · <span className="live-dot" style={{ margin: '0 4px 1px' }} />{onSite} people on site right now
        </p>
      </div>

      <AnimatePresence>
        {setupDone < 5 && (
          <motion.div className="card20" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, padding: 0 }}>
            <div className="row between">
              <h2 className="h18">Finish setting up</h2>
              <span className="small muted">{setupDone} of 5 done</span>
            </div>
            <div className="track"><Fill width={setupDone * 20 + '%'} color="var(--brand)" /></div>
            {setup.map(([l, sub, d]) => (
              <div key={l} className="row g12" style={{ padding: '6px 0' }}>
                <Icon name={d ? 'check_circle' : 'radio_button_unchecked'} style={{ color: d ? 'var(--ok-text)' : 'var(--outline)' }} />
                <div className="stack" style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{l}</span>
                  <span className="small muted">{sub}</span>
                </div>
                {!d && <button type="button" className="btn sm btn-filled" onClick={esign}>E-sign</button>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Stagger className="tiles">
        {tiles.map(([v, icon, l, to, bg, fg]) => (
          <motion.button
            key={l}
            type="button"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: '0 8px 20px rgba(0,0,0,.08)' }}
            whileTap={{ scale: 0.98 }}
            className="tile"
            style={{ background: bg, color: fg }}
            onClick={() => s.setScreen(to)}
          >
            <Icon name={icon} />
            <span className="v">{/^[₹\d]/.test(v) ? <CountUp value={v} /> : v}</span>
            <span style={{ fontSize: 14 }}>{l}</span>
          </motion.button>
        ))}
      </Stagger>

      <div className="two-col" style={{ gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)' }}>
        <div className="card20">
          <h2 className="h18">Upcoming bookings</h2>
          <AnimatePresence initial={false}>
            {s.bookings.map(b => (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={m.spatial()}
                className="row g14"
                style={{ padding: '10px 0', borderTop: '1px solid var(--line)', position: 'relative' }}
              >
                {/* New bookings flash a highlight that fades (opacity only). */}
                <motion.span aria-hidden style={{ position: 'absolute', inset: 0, background: 'var(--primary-soft)', borderRadius: 8, pointerEvents: 'none' }} initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 1.1 }} />
                <div className="stack" style={{ width: 48, flex: 'none', alignItems: 'center', lineHeight: 1.1 }}>
                  <span className="xs muted">{b.dow}</span><span style={{ fontSize: 20 }}>{b.day}</span>
                </div>
                <div className="stack" style={{ flex: 1, gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{b.count} × {b.role} · {b.loc}</span>
                  <span className="small muted">{b.time} · {b.total}</span>
                </div>
                <span className="tag lg" style={{ background: T[b.sev][0], color: T[b.sev][1] }}>{b.status}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="card20">
          <h2 className="h18">Rebook a crew</h2>
          {pools.map(([name, sub, faces, form], i) => (
            <div key={name} className="row g12" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <div className="row">
                {faces.map((x, j) => (
                  <motion.div
                    key={x}
                    className="face"
                    style={{ background: AV[(i + j) % AV.length] }}
                    initial={{ scale: 0, x: -10 }}
                    animate={{ scale: 1, x: 0 }}
                    transition={{ ...m.spatial('fast'), delay: 0.2 + m.stagger(j) }}
                  >
                    {x}
                  </motion.div>
                ))}
              </div>
              <div className="stack" style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                <span className="small muted">{sub}</span>
              </div>
              <button
                type="button"
                className="btn sm btn-outline"
                onClick={() => {
                  s.setF(form);
                  s.setScreen('book');
                  s.say('Form filled with your ' + name + '. Favourites get the first invite.');
                }}
              >
                Rebook
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
