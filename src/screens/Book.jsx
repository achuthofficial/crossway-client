import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DATES, HOURS, inr, LOCS, quote, RATES, T } from '../data.js';
import { Icon } from '../ui.jsx';
import { useMotion } from '../motion';

/** Very small natural-language parser for the "Describe it" box. */
function parse(text) {
  const t = text.toLowerCase();
  const p = {};
  const m = t.match(/(\d+)/);
  if (m) p.count = Math.min(50, +m[1]);
  if (/cook|kitchen/.test(t)) p.role = 'kitchen';
  else if (/clean|house/.test(t)) p.role = 'cleaner';
  else if (/barista|coffee/.test(t)) p.role = 'barista';
  else if (/cash/.test(t)) p.role = 'cashier';
  else if (/wait|server|steward/.test(t)) p.role = 'waiter';
  if (/koramangala/.test(t)) p.loc = 'Koramangala';
  else if (/hsr/.test(t)) p.loc = 'HSR Layout';
  else if (/indiranagar/.test(t)) p.loc = 'Indiranagar';
  if (/today|now/.test(t)) p.date = 'd0';
  else if (/tomorrow|sunday/.test(t)) p.date = 'd1';
  else if (/diwali/.test(t)) p.date = 'd4';
  else if (/saturday/.test(t)) p.date = 'd3';
  return p;
}

const Field = ({ label, color, children }) => (
  <div className="stack g6">
    <label className="field-label" style={color ? { color } : undefined}>{label}</label>
    {children}
  </div>
);

export default function Book({ s }) {
  const m = useMotion();
  const [copilot, setCopilot] = useState('');
  const { f, R } = s;
  const q = quote(f);

  const checks = [];
  if (s.effAcct === 'esign') checks.push(['Booking is locked until your service agreement is e-signed.', 'lock', 'bad']);
  if (s.effAcct === 'hold') checks.push(['Credit hold: pay an overdue invoice before booking.', 'credit_card_off', 'bad']);
  if (q.past) checks.push(['That start time has already passed today. Pick a later time or another day.', 'schedule', 'bad']);
  if (q.long) checks.push(["Shifts longer than 12 hours aren't allowed under labour rules. Split it into two bookings.", 'gavel', 'bad']);
  if (q.urgent) checks.push(["Starts in under 4 hours: a 20% same-day rate applies. We'll fill as many as we can in time; you only pay for workers who check in.", 'bolt', 'warn']);
  if (q.peak) checks.push(['Festival peak: demand is high. A 15% peak rate applies and booking early improves your fill.', 'celebration', 'warn']);
  if (f.count > q.supply) checks.push([`About ${q.supply} verified ${q.r.label.toLowerCase()}s are free near ${f.loc} at that time. We'll invite from 8 km out and keep you posted; partial fills are billed per worker.`, 'groups', 'warn']);
  if (q.night) checks.push(['Ends late: women workers get a verified cab home at no extra cost.', 'local_taxi', 'info']);
  if (f.count >= 3 && !q.past) checks.push(['No-show guarantee: 1 standby worker is held for this booking.', 'verified', 'ok']);

  const blocked = s.effAcct !== 'active' || q.past || q.long;
  const cantBook = R.limit === 0;
  const overLimit = !blocked && q.total > R.limit;
  const cta = cantBook ? "Your role can't book" : blocked ? 'Fix the issues above' : overLimit ? 'Send to Neha for approval' : 'Confirm booking';

  const lines = [
    [`${f.count} × ${q.hrs} h × ${inr(q.r.r)}/h`, inr(q.base)],
    ...(q.sur ? [[q.urgent ? 'Same-day rate (20%)' : 'Festival peak (15%)', inr(q.sur)]] : []),
    ['GST 18%', inr(q.gst)],
    ...(q.occ > 1 ? [['× 4 weeks', 'recurring']] : []),
  ];

  const confirm = () => {
    if (blocked || cantBook) return;
    const d = q.d;
    const item = { id: 'b' + Date.now(), dow: d.dow, day: d.day, count: f.count, role: q.r.label, loc: f.loc, time: HOURS[+f.start].l + '–' + HOURS[+f.end].l, total: inr(q.total) };
    if (overLimit) {
      s.setApprovals(a => [...a, { id: item.id, t: `${R.label} wants ${f.count} × ${q.r.label} on ${d.label} at ${f.loc} for ${inr(q.total)} (limit ${inr(R.limit)})`, item }]);
      s.say('Above your ' + inr(R.limit) + ' limit. Sent to Neha Kapoor for approval.');
    } else {
      s.setBookings(b => [{ ...item, status: 'Finding crew · 0 of ' + f.count, sev: 'warn' }, ...b]);
      s.setScreen('home');
      s.say('Booked. Autopilot is inviting matched workers now.');
    }
  };

  const runCopilot = () => {
    const p = parse(copilot);
    if (!Object.keys(p).length) return s.say('I couldn\'t read that. Try "5 waiters Saturday Indiranagar 6 pm to midnight".');
    s.setF(p);
    s.say('Form filled. Check the details, then confirm.');
  };

  const timeBad = q.past || q.long;
  const overSupply = f.count > q.supply;

  return (
    <div className="book-grid">
      <div className="stack g20">
        <div><div className="eyebrow">C2 · Instant shift booking</div><h1 className="h1">Book staff</h1></div>
        <div className="copilot">
          <Icon name="auto_awesome" style={{ color: 'var(--primary)' }} />
          <input
            value={copilot}
            onChange={e => setCopilot(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runCopilot()}
            placeholder="Describe it: 5 waiters Saturday Indiranagar 6 pm to midnight"
            aria-label="Describe the booking"
          />
          <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn sm btn-filled" onClick={runCopilot}>Fill form</motion.button>
        </div>

        <div className="form-grid">
          <Field label="Role">
            <select className="big-select" value={f.role} onChange={e => s.setF({ role: e.target.value })}>
              {Object.entries(RATES).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Outlet">
            <select className="big-select" value={f.loc} onChange={e => s.setF({ loc: e.target.value })}>
              {LOCS.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <select className="big-select" value={f.date} onChange={e => s.setF({ date: e.target.value })}>
              {DATES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Headcount" color={overSupply ? 'var(--warn-text)' : undefined}>
            <div className={'stepper' + (overSupply ? ' warn' : '')}>
              <motion.button whileTap={{ scale: 0.85 }} type="button" className="icon-btn" aria-label="Fewer" onClick={() => s.setF({ count: Math.max(1, f.count - 1) })}><Icon name="remove" /></motion.button>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={f.count} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} style={{ fontSize: 18 }}>
                  {f.count}
                </motion.span>
              </AnimatePresence>
              <motion.button whileTap={{ scale: 0.85 }} type="button" className="icon-btn" aria-label="More" onClick={() => s.setF({ count: Math.min(50, f.count + 1) })}><Icon name="add" /></motion.button>
            </div>
          </Field>
          <Field label="Start" color={timeBad ? 'var(--danger)' : undefined}>
            <select className={'big-select' + (timeBad ? ' bad' : '')} value={f.start} onChange={e => s.setF({ start: e.target.value })}>
              {HOURS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </Field>
          <Field label="End" color={timeBad ? 'var(--danger)' : undefined}>
            <select className={'big-select' + (timeBad ? ' bad' : '')} value={f.end} onChange={e => s.setF({ end: e.target.value })}>
              {HOURS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </Field>
        </div>

        <label className="row g12" style={{ cursor: 'pointer', fontSize: 15 }}>
          <input type="checkbox" checked={f.recurring} onChange={() => s.setF({ recurring: !f.recurring })} style={{ width: 20, height: 20, accentColor: 'var(--brand)' }} />
          Repeat every week for 4 weeks
        </label>

        <motion.div className="stack g8" layout>
          <AnimatePresence initial={false}>
            {checks.map(([t, icon, sv]) => (
              <motion.div
                key={icon + sv}
                layout
                className="check"
                style={{ background: T[sv][0], color: T[sv][1] }}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: m.effects('fast') }}
              >
                <Icon name={icon} /><span>{t}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.aside className="quote" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...m.spatial(), delay: 0.1 }}>
        <h2 className="h18">Price before you confirm</h2>
        {lines.map(([k, v]) => (
          <div key={k} className="row between g12" style={{ fontSize: 14 }}>
            <span>{k}</span>
            <motion.span key={v} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }}>{v}</motion.span>
          </div>
        ))}
        <div className="small muted">Worker gets {inr(q.r.pay)}/h, paid daily</div>
        <div style={{ height: 1, background: 'var(--line)' }} />
        <div className="row between" style={{ alignItems: 'baseline' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Total</span>
          <motion.span key={q.total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={m.spatial('fast')} style={{ fontSize: 28, display: 'inline-block', transformOrigin: 'right center' }}>
            {inr(q.total)}
          </motion.span>
        </div>
        <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
          Free cancellation until 4 h before start; 50% after. No-show guarantee: free replacement within 45 min, or the shift isn't billed.
        </span>
        <motion.button whileHover={{ scale: blocked || cantBook ? 1 : 1.02 }} whileTap={{ scale: 0.97 }} type="button" className="cta-big" disabled={blocked || cantBook} onClick={confirm}>
          {cta}<Icon name="arrow_forward" />
        </motion.button>
      </motion.aside>
    </div>
  );
}
