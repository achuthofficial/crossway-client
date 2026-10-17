import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AV, ini, NFG } from '../data.js';
import { Act, Icon, itemVariants, PageHead, Stagger, Tag } from '../ui.jsx';
import { useMotion } from '../motion';

/* ---------------- C15 Support ---------------- */
const TICKETS = [
  { id: 'TK-4402', s: 'Replacement for no-show arrived late', when: 'Opened 16 Oct', sla: 'Reply due in 22 h', sv: 'info', status: 'Open' },
  { id: 'TK-4371', s: 'GST invoice has wrong outlet address', when: 'Opened 11 Oct', sla: 'SLA breached · escalated', sv: 'bad', status: 'Escalated' },
  { id: 'TK-4320', s: 'Add HSR outlet to account', when: 'Closed 4 Oct', sla: 'Resolved in 2 h', sv: 'ok', status: 'Resolved' },
];

/** Canned account-manager replies so the chat feels alive in the static prototype. */
function replyTo(text) {
  const t = text.toLowerCase();
  if (/invoice|gst|bill/.test(t)) return "I'll get the GST invoice corrected and re-issued today. You'll see it under Invoices.";
  if (/staff|book|worker|crew|shift/.test(t)) return 'Sure. Book it from the Book tab and I\'ll make sure your favourites get the first invite.';
  if (/thank/.test(t)) return 'Anytime, Neha. Have a great weekend service!';
  return "Got it. I'll look into this and update you here within the hour.";
}

export function Support() {
  const m = useMotion();
  const [chat, setChat] = useState([{ me: false, t: 'Hi Neha, the Decathlon-style no-show credit is on your next invoice. Anything else for this weekend?' }]);
  const [msg, setMsg] = useState('');
  const [typing, setTyping] = useState(false);
  const end = useRef(null);
  const timer = useRef();

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), [chat, typing]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = () => {
    const t = msg.trim();
    if (!t) return;
    setChat(c => [...c, { me: true, t }]);
    setMsg('');
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setChat(c => [...c, { me: false, t: replyTo(t) }]);
    }, 1400);
  };

  return (
    <div className="support-grid">
      <div className="stack g16">
        <div><div className="eyebrow">C15 · Support and SLA</div><h1 className="h1">Support</h1></div>
        <Stagger className="list20">
          {TICKETS.map(t => (
            <motion.div key={t.id} variants={itemVariants} className="list-row" style={{ padding: '14px 18px' }}>
              <div className="stack" style={{ flex: '1 1 240px' }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{t.s}</span>
                <span className="small muted">{t.id} · {t.when}</span>
              </div>
              <span className="small" style={{ color: NFG[t.sv] }}>{t.sla}</span>
              <Tag sev={t.sv} lg>{t.status}</Tag>
            </motion.div>
          ))}
        </Stagger>
      </div>
      <motion.div className="chat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...m.spatial(), delay: 0.1 }}>
        <div className="row g12">
          <div className="av" style={{ width: 44, height: 44, borderRadius: 22, background: '#34A853' }}>VR</div>
          <div className="stack">
            <span style={{ fontSize: 15, fontWeight: 500 }}>Vivek Rao</span>
            <span className="small muted"><span className="live-dot" style={{ marginRight: 6 }} />Your account manager · replies in ~10 min</span>
          </div>
        </div>
        <div className="stack g8" style={{ maxHeight: 360, overflowY: 'auto' }}>
          <AnimatePresence initial={false}>
            {chat.map((bubble, i) => (
              <motion.div
                key={i}
                className={'bubble ' + (bubble.me ? 'me' : 'them')}
                initial={{ opacity: 0, y: 10, scale: 0.95, originX: bubble.me ? 1 : 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={m.spatial('fast')}
              >
                {bubble.t}
              </motion.div>
            ))}
            {typing && (
              <motion.div key="typing" className="bubble them typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span /><span /><span />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={end} />
        </div>
        <div className="composer">
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message Vivek" aria-label="Message" />
          <motion.button whileTap={{ scale: 0.85, rotate: -20 }} type="button" className="send" disabled={!msg.trim()} onClick={send} aria-label="Send">
            <Icon name="send" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- C13 Team ---------------- */
export function Team({ s }) {
  const m = useMotion();
  const owners = s.team.filter(u => u.role === 'Account Owner').length;
  const remove = u => {
    if (u.role === 'Account Owner' && owners <= 1) return s.say("You can't remove the only Account Owner. Add another owner first.");
    s.setTeam(t => t.filter(x => x.id !== u.id));
    s.say(u.name + ' removed. Their open approvals move to Neha.');
  };
  const decide = (a, ok) => {
    s.setApprovals(list => list.filter(x => x.id !== a.id));
    if (ok) s.setBookings(b => [{ ...a.item, status: 'Finding crew', sev: 'warn' }, ...b]);
    s.say(ok ? 'Approved and booked.' : 'Declined. The requester is notified.');
  };
  return (
    <div className="stack g20" style={{ maxWidth: 960 }}>
      <PageHead eyebrow="C13 · Users and approvals" title="Team and approval limits" lead="Bookings above a person's limit go to the Account Owner for approval." />
      <div className="list20">
        <AnimatePresence initial={false}>
          {s.team.map((u, i) => (
            <motion.div
              key={u.id}
              layout
              className="list-row"
              style={{ padding: '14px 18px', overflow: 'hidden' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { ...m.spatial(), delay: m.stagger(i) } }}
              exit={{ opacity: 0, x: -40, height: 0, paddingTop: 0, paddingBottom: 0 }}
            >
              <div className="av" style={{ background: AV[i % AV.length] }}>{ini(u.name)}</div>
              <div className="stack" style={{ flex: '1 1 200px' }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{u.name}</span>
                <span className="small muted">{u.role} · {u.scope}</span>
              </div>
              <span style={{ flex: '0 0 160px', fontSize: 14 }}>{u.limit}</span>
              <button type="button" className="btn sm btn-outline danger" onClick={() => remove(u)}>Remove</button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {s.approvals.length > 0 && (
          <motion.div className="stack g12" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="h18" style={{ marginTop: 8 }}>Waiting for your approval</h2>
            <AnimatePresence>
              {s.approvals.map(a => (
                <motion.div key={a.id} layout exit={{ opacity: 0, scale: 0.95 }} className="banner warn" style={{ padding: '14px 18px', borderRadius: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Icon name="pending_actions" />
                  <span style={{ flex: 1, fontSize: 14 }}>{a.t}</span>
                  <Act kind="p" label="Approve" on={() => decide(a, true)} />
                  <button type="button" className="btn sm" style={{ border: '1px solid var(--warn-fg)', background: 'transparent', color: 'var(--warn-fg)' }} onClick={() => decide(a, false)}>Decline</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
