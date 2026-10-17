import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NAV, ROLES } from './data.js';
import { usePortal } from './store.js';
import { Icon } from './ui.jsx';
import { IconMorph, MotionProvider, useMotion, useTheme } from './motion';
import Landing from './screens/Landing.jsx';
import Modals from './components/Modals.jsx';
import EdgeDrawer, { EDGE_COUNT } from './components/EdgeDrawer.jsx';
import Notifications from './components/Notifications.jsx';
import Home from './screens/Home.jsx';
import Book from './screens/Book.jsx';
import { Live, Timesheets, Workers } from './screens/Workforce.jsx';
import Hiring from './screens/Hiring.jsx';
import { Invoices, Payroll, Vault } from './screens/Money.jsx';
import { Support, Team } from './screens/Account.jsx';

const SCREENS = { home: Home, book: Book, live: Live, timesheets: Timesheets, hiring: Hiring, workers: Workers, invoices: Invoices, payroll: Payroll, vault: Vault, support: Support, team: Team };

function Rail({ s }) {
  const m = useMotion();
  const badge = id =>
    id === 'timesheets' ? s.ts.filter(t => !t.locked && !t.done).length
      : id === 'live' ? s.live.filter(w => w.sev === 'bad').length
        : id === 'invoices' ? s.inv.filter(i => i.sev === 'bad').length
          : 0;
  return (
    <nav className="rail" aria-label="Main">
      <motion.div className="rail-logo" whileHover={{ rotate: -10 }}><Icon name="alt_route" size={24} /></motion.div>
      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} type="button" className="fab" title="Book staff" onClick={() => s.setScreen('book')}>
        <Icon name="add" />
      </motion.button>
      {NAV.map(([id, label, icon]) => {
        const active = id === s.screen;
        const ok = s.R.s.includes(id);
        const n = badge(id);
        return (
          <button key={id} type="button" className={'rail-item' + (active ? ' active' : '') + (ok ? '' : ' locked')} onClick={() => s.setScreen(id)} aria-current={active ? 'page' : undefined}>
            <span className="rail-ind">
              {active && <motion.span layoutId="rail-pill" className="pill" transition={m.spatial('fast')} />}
              <Icon name={icon} className={active ? 'fill1' : ''} />
              <AnimatePresence>
                {ok && n > 0 && (
                  <motion.span key={n} className="rail-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={m.spatial('fast')}>
                    {n}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className="lbl">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Banner({ s }) {
  let b = null;
  if (s.effAcct === 'esign')
    b = { bg: 'var(--warn-bg)', fg: 'var(--warn-fg)', icon: 'draw', text: "Your service agreement isn't signed yet. You can look around, but booking and hiring unlock after e-sign.", cta: 'E-sign now', btn: 'var(--brand)', btnFg: 'var(--on-brand)', act: () => { s.setEsignDone(true); s.say('Agreement signed with Aadhaar e-Sign. Booking is unlocked.'); } };
  else if (s.effAcct === 'hold')
    b = { bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', icon: 'credit_card_off', text: 'Bookings are paused: ₹2,14,720 outstanding is above your ₹2,00,000 credit limit. Pay an overdue invoice to resume.', cta: 'Pay now', btn: 'var(--danger)', btnFg: 'var(--md-sys-color-on-error)', act: () => s.setScreen('invoices') };
  return (
    <AnimatePresence>
      {b && (
        <motion.div
          key={b.icon}
          className="acct-banner"
          style={{ background: b.bg, color: b.fg }}
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
        >
          <Icon name={b.icon} />
          <span style={{ flex: 1, minWidth: 240, fontSize: 14, lineHeight: 1.45 }}>{b.text}</span>
          <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn md" style={{ background: b.btn, color: b.btnFg }} onClick={b.act}>{b.cta}</motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const isLanding = () => window.location.hash === '#/welcome';

export default function App() {
  const [landing, setLanding] = useState(isLanding);
  useEffect(() => {
    const on = () => setLanding(isLanding());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return (
    <MotionProvider scheme="expressive">
      {landing ? <Landing onEnter={() => { window.location.hash = '#/home'; }} /> : <Portal />}
    </MotionProvider>
  );
}

function Portal() {
  const s = usePortal();
  const m = useMotion();
  const theme = useTheme();
  const allowed = s.R.s.includes(s.screen);
  const label = (NAV.find(n => n[0] === s.screen) || [])[1];
  const Screen = SCREENS[s.screen];

  return (
    <div className="shell">
      <Rail s={s} />
      <div className="c-main">
        <header className="c-top">
          <div className="c-title">
            <b>CrossWay for Business</b>
            <span className="xs muted">Saffron Table Restaurants Pvt. Ltd. · GSTIN 29ABCDE1234F1Z5</span>
          </div>
          <div className="spacer" />
          <a className="btn btn-text" href="#/welcome"><Icon name="auto_stories" />Product tour</a>
          <Notifications s={s} />
          <button
            type="button"
            className="icon-btn"
            aria-label={theme.mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={e => theme.toggle({ x: e.clientX, y: e.clientY })}
          >
            <IconMorph icon={theme.mode === 'dark' ? 'light_mode' : 'dark_mode'} />
          </button>
          <button type="button" className="btn btn-outline" style={{ padding: '0 16px 0 12px' }} onClick={() => s.setEdgeOpen(true)}>
            <Icon name="rule" />Edge cases · {EDGE_COUNT}
          </button>
          <div className="role-pill">
            <span className="small muted">Signed in as</span>
            <select value={s.role} onChange={e => s.setRole(e.target.value)} aria-label="Role">
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="avatar" style={{ width: 36, height: 36, borderRadius: 18, background: '#FBBC04', color: '#3B2A00' }}>NK</div>
        </header>

        <Banner s={s} />

        <main className="c-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={s.screen + (allowed ? '' : '-denied')}
              /* M3 "fade through" between top-level destinations. */
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1, transition: { ...m.spatial(), opacity: m.effects() } }}
              exit={{ opacity: 0, transition: m.effects('fast') }}
            >
              {allowed ? (
                <Screen s={s} />
              ) : (
                <div className="stack g12" style={{ maxWidth: 520, padding: '40px 0' }}>
                  <motion.div className="icon-circle" style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--surface-3)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={m.spatial('fast')}>
                    <Icon name="lock" size={28} />
                  </motion.div>
                  <h1 className="h1" style={{ marginTop: 8 }}>{label} isn't part of your role</h1>
                  <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                    {s.R.label}s can't open {label}. Ask your Account Owner, Neha Kapoor, to change your access.
                  </p>
                  <div className="row g8" style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn-filled" onClick={() => s.say('Request sent to Neha Kapoor.')}>Ask for access</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Modals s={s} />
      <EdgeDrawer s={s} />
      <AnimatePresence>
        {s.toast && (
          <motion.div
            key={s.toast.key}
            className="toast"
            role="status"
            style={{ left: 104 }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0, transition: { ...m.spatial('fast'), opacity: m.effects('fast') } }}
            exit={{ opacity: 0, y: 16, transition: m.effects('fast') }}
          >
            <Icon name="check_circle" />{s.toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
