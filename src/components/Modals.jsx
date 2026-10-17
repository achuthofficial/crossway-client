import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { T } from '../data.js';
import { Icon } from '../ui.jsx';

const pop = {
  initial: { opacity: 0, scale: 0.92, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 32 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
};

function Dialog({ width = 480, onClose, children }) {
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="dialog" style={{ width: `min(${width}px, 100%)` }} role="dialog" aria-modal="true" {...pop} onClick={e => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}

const Footer = ({ onClose, onOk, okLabel, disabled, danger, busy }) => (
  <div className="row g8" style={{ justifyContent: 'flex-end' }}>
    <button type="button" className="btn btn-text" onClick={onClose}>Cancel</button>
    <motion.button whileTap={{ scale: 0.96 }} type="button" className={'btn ' + (danger ? 'btn-danger' : 'btn-filled')} disabled={disabled} onClick={onOk}>
      {busy && <span className="spinner" />}{okLabel}
    </motion.button>
  </div>
);

function Dispute({ s, m, close }) {
  const t = s.ts.find(x => x.id === m.id) || {};
  const [reason, setReason] = useState('');
  const [hours, setHours] = useState(String(t.max));
  const h = parseFloat(hours);
  const err = hours !== '' && (isNaN(h) || h < 0 || h > t.max);
  const ok = () => {
    s.patchTs(t.id, { done: true });
    s.say('Dispute sent. Ops reply within 24 h; the worker is paid ' + hours + ' h now.');
    close();
  };
  return (
    <Dialog onClose={close}>
      <h2>Dispute hours</h2>
      <p className="lead" style={{ margin: 0 }}>
        {t.name} · {t.date} · app recorded {t.hours}. CrossWay ops review the GPS and selfie record and reply within 24 h. The
        worker is paid for undisputed hours on time.
      </p>
      <div className="stack g6">
        <label className="field-label" htmlFor="dr">What happened</label>
        <select id="dr" className="select" style={{ height: 48, fontSize: 15 }} value={reason} onChange={e => setReason(e.target.value)}>
          <option value="">Choose a reason</option>
          {['Sent home early', 'Arrived late', 'Long unrecorded break', 'Did not do the work'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="stack g6">
        <label className="field-label" htmlFor="dh">Hours you agree to</label>
        <input id="dh" className={'input' + (err ? ' bad' : '')} value={hours} inputMode="decimal" onChange={e => setHours(e.target.value)} />
        <AnimatePresence>
          {err && (
            <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="xs" style={{ color: 'var(--danger)' }}>
              Enter a number between 0 and {t.max}.
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <Footer onClose={close} onOk={ok} okLabel="Send dispute" disabled={!reason || err || hours === ''} />
    </Dialog>
  );
}

const METHODS = [['upi', 'UPI', 'qr_code_2', 'Instant'], ['nb', 'Net banking', 'account_balance', 'Instant'], ['card', 'Card', 'credit_card', '1.8% fee']];

function Pay({ s, m, close }) {
  const inv = s.inv.find(x => x.id === m.id) || {};
  const [method, setMethod] = useState('upi');
  const [tries, setTries] = useState(0);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  // Demo flow: the first attempt times out at the bank; the retry succeeds.
  const pay = () => {
    setPaying(true);
    timer.current = setTimeout(() => {
      setPaying(false);
      if (tries === 0) return setTries(1);
      setPaid(true);
      s.patchInv(inv.id, { pay: false, status: 'Paid', sev: 'ok' });
      if (s.acct === 'hold') s.setPaidAdvance(true);
      s.say('Paid ' + inv.amt + '. Receipt emailed to Finance.');
      timer.current = setTimeout(close, 900);
    }, 900);
  };

  return (
    <Dialog width={460} onClose={close}>
      <h2>Pay {inv.no}</h2>
      <div className="row between" style={{ fontSize: 15 }}><span>Amount due</span><span style={{ fontSize: 22 }}>{inv.amt}</span></div>
      <AnimatePresence mode="wait">
        {paid ? (
          <motion.div key="ok" className="stack g8" style={{ alignItems: 'center', padding: '16px 0' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div className="icon-circle" style={{ width: 64, height: 64, borderRadius: 32, background: T.ok[0], color: T.ok[1] }} initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}>
              <Icon name="check" size={36} />
            </motion.div>
            <span style={{ fontSize: 16 }}>Payment received</span>
          </motion.div>
        ) : (
          <motion.div key="form" className="stack g6" exit={{ opacity: 0 }}>
            {METHODS.map(([id, l, icon, sub]) => (
              <button key={id} type="button" className={'radio-opt' + (method === id ? ' on' : '')} onClick={() => setMethod(id)}>
                <Icon name={method === id ? 'radio_button_checked' : 'radio_button_unchecked'} />
                <Icon name={icon} style={{ color: 'var(--text)' }} />
                <span style={{ fontSize: 15, flex: 1 }}>{l}</span>
                <span className="xs muted">{sub}</span>
              </button>
            ))}
            <AnimatePresence>
              {tries > 0 && !paying && (
                <motion.div className="banner bad" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} transition={{ duration: 0.4 }}>
                  <Icon name="error" />
                  Payment failed: bank timed out. No money was taken. If your account was debited, it's refunded automatically in 5–7 working days.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      {!paid && <Footer onClose={close} onOk={pay} okLabel={paying ? 'Processing…' : tries > 0 ? 'Try again' : 'Pay ' + inv.amt} disabled={paying} busy={paying} />}
    </Dialog>
  );
}

function Block({ s, m, close }) {
  const w = s.workers.find(x => x.id === m.id) || {};
  const [reason, setReason] = useState('');
  const ok = () => {
    s.patchWorker(w.id, { blocked: true, fav: false });
    s.say(w.name + ' blocked. Already-worked shifts are still paid.');
    close();
  };
  return (
    <Dialog width={440} onClose={close}>
      <h2>Block {w.name}?</h2>
      <p className="lead" style={{ margin: 0 }}>
        They won't be sent to any Saffron Table outlet again. CrossWay reviews the reason; the worker can see that a client blocked them but not who.
      </p>
      <select className="select" style={{ height: 48, fontSize: 15 }} value={reason} onChange={e => setReason(e.target.value)} aria-label="Reason">
        <option value="">Choose a reason</option>
        {['Repeated lateness', 'Unsafe or rude behaviour', 'Poor quality of work', 'Other'].map(r => <option key={r}>{r}</option>)}
      </select>
      <Footer onClose={close} onOk={ok} okLabel="Block" disabled={!reason} danger />
    </Dialog>
  );
}

const SAMPLE_JD = `Run a 60-cover restaurant in HSR Layout. Lead a team of 14 across floor and kitchen, own the rota, stock and daily P&L, and keep hygiene audits clean.

You'll need 4+ years in casual dining, 1+ as a manager, and Kannada or Hindi with English.

Screening: 1) Largest team you've managed? 2) Notice period?`;

function Post({ s, close }) {
  const [title, setTitle] = useState('Restaurant manager');
  const [sal, setSal] = useState('30000');
  const [jd, setJd] = useState('');
  const [writing, setWriting] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearInterval(timer.current), []);

  const n = parseInt(sal, 10);
  const sv = isNaN(n) ? 'mute' : n < 28000 ? 'warn' : 'ok';
  const msg = isNaN(n)
    ? 'Enter a salary to see the benchmark.'
    : n < 28000
      ? `₹${n.toLocaleString('en-IN')} is below the 25th percentile for restaurant managers in Bengaluru (₹32,000–₹44,000). Expect a slow fill and higher dropout.`
      : n > 60000
        ? "Above the 90th percentile. You'll attract strong candidates; check it fits your budget."
        : 'Within the market range for Bengaluru (₹32,000–₹44,000 median band).';
  const invalid = !title.trim() || isNaN(n) || !jd.trim() || writing;

  // Type the AI draft out so it reads as being written.
  const write = () => {
    clearInterval(timer.current);
    setWriting(true);
    let i = 0;
    timer.current = setInterval(() => {
      i += 6;
      setJd(SAMPLE_JD.slice(0, i));
      if (i >= SAMPLE_JD.length) { clearInterval(timer.current); setWriting(false); }
    }, 16);
  };

  return (
    <Dialog width={600} onClose={close}>
      <h2>Post a permanent job</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="stack g6" style={{ gridColumn: '1/-1' }}>
          <label className="field-label" htmlFor="jt">Job title</label>
          <input id="jt" className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="stack g6">
          <label className="field-label" htmlFor="js">Monthly salary (₹)</label>
          <input id="js" className="input" style={sv === 'warn' ? { border: '2px solid #F9AB00' } : undefined} value={sal} inputMode="numeric" onChange={e => setSal(e.target.value.replace(/\D/g, ''))} />
        </div>
        <div className="stack g6">
          <label className="field-label" htmlFor="jm">Hiring model</label>
          <select id="jm" className="select" style={{ height: 48, fontSize: 15 }}>
            <option>30-day replacement</option><option>7-day</option><option>6-month</option><option>1-year</option>
          </select>
        </div>
      </div>
      <motion.div layout className="banner" style={{ background: T[sv][0], color: T[sv][1] }}>
        <Icon name="insights" /><span>{msg}</span>
      </motion.div>
      <div className="stack g6">
        <div className="row between">
          <label className="field-label" htmlFor="jd">Job description</label>
          <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn btn-tonal" style={{ height: 30, padding: '0 12px', fontSize: 12.5 }} onClick={write} disabled={writing}>
            <motion.span animate={writing ? { rotate: 360 } : { rotate: 0 }} transition={writing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}>
              <Icon name="auto_awesome" size={16} />
            </motion.span>
            {writing ? 'Writing…' : 'Write with AI'}
          </motion.button>
        </div>
        <textarea id="jd" className="textarea" rows={6} value={jd} onChange={e => setJd(e.target.value)} />
      </div>
      <Footer
        onClose={close}
        onOk={() => { close(); s.say('Job posted. AI Recruiter starts screening; first shortlist in 48 h.'); }}
        okLabel="Post job"
        disabled={invalid}
      />
    </Dialog>
  );
}

export default function Modals({ s }) {
  const m = s.modal;
  const close = () => s.setModal(null);
  const C = m && { dispute: Dispute, pay: Pay, block: Block, post: Post }[m.kind];
  return <AnimatePresence>{C && <C key={m.kind + (m.id || '')} s={s} m={m} close={close} />}</AnimatePresence>;
}
