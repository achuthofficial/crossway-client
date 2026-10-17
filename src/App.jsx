import { AnimatePresence, motion } from 'motion/react';
import { NAV, ROLES } from './data.js';
import { usePortal } from './store.js';
import { Icon } from './ui.jsx';
import Modals from './components/Modals.jsx';
import EdgeDrawer, { EDGE_COUNT } from './components/EdgeDrawer.jsx';
import Home from './screens/Home.jsx';
import Book from './screens/Book.jsx';
import { Live, Timesheets, Workers } from './screens/Workforce.jsx';
import Hiring from './screens/Hiring.jsx';
import { Invoices, Payroll, Vault } from './screens/Money.jsx';
import { Support, Team } from './screens/Account.jsx';

const SCREENS = { home: Home, book: Book, live: Live, timesheets: Timesheets, hiring: Hiring, workers: Workers, invoices: Invoices, payroll: Payroll, vault: Vault, support: Support, team: Team };

function Rail({ s }) {
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
              {active && <motion.span layoutId="rail-pill" className="pill" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <Icon name={icon} className={active ? 'fill1' : ''} />
              <AnimatePresence>
                {ok && n > 0 && (
                  <motion.span key={n} className="rail-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
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
    b = { bg: '#FEEFC3', fg: '#594300', icon: 'draw', text: "Your service agreement isn't signed yet. You can look around, but booking and hiring unlock after e-sign.", cta: 'E-sign now', btn: '#0B57D0', act: () => { s.setEsignDone(true); s.say('Agreement signed with Aadhaar e-Sign. Booking is unlocked.'); } };
  else if (s.effAcct === 'hold')
    b = { bg: '#F9DEDC', fg: '#410E0B', icon: 'credit_card_off', text: 'Bookings are paused: ₹2,14,720 outstanding is above your ₹2,00,000 credit limit. Pay an overdue invoice to resume.', cta: 'Pay now', btn: '#B3261E', act: () => s.setScreen('invoices') };
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
          <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn md" style={{ background: b.btn, color: '#fff' }} onClick={b.act}>{b.cta}</motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const s = usePortal();
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
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {allowed ? (
                <Screen s={s} />
              ) : (
                <div className="stack g12" style={{ maxWidth: 520, padding: '40px 0' }}>
                  <motion.div className="icon-circle" style={{ width: 56, height: 56, borderRadius: 28, background: '#E9EEF6' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}>
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
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <Icon name="check_circle" />{s.toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
