import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { ini, NFG } from '../data.js';
import { Act, Icon, PageHead } from '../ui.jsx';

const STAGES = [['short', 'Shortlisted'], ['inter', 'Interviewing'], ['offer', 'Offered'], ['joined', 'Joined']];

export default function Hiring({ s }) {
  const isInt = s.role === 'interviewer';
  const canPost = !isInt && s.effAcct === 'active';

  const move = (c, to, { t, patch }) => {
    s.setPipe(p => {
      const n = {};
      for (const k in p) n[k] = p[k].filter(x => x.id !== c.id);
      n[to] = [...n[to], { ...c, ...patch, st: to }];
      return n;
    });
    s.say(t);
  };
  const edit = (k, id, patch) => s.setPipe(p => ({ ...p, [k]: p[k].map(x => (x.id === id ? { ...x, ...patch } : x)) }));
  const drop = (k, id) => s.setPipe(p => ({ ...p, [k]: p[k].filter(x => x.id !== id) }));

  const actions = (k, c) => {
    if (k === 'short')
      return c.bgv
        ? [{ label: 'Schedule interview', kind: 'p', on: () => move(c, 'inter', { t: 'Interview booked. Offer stays locked until her check clears.', patch: { note: 'Interview Tue 21 Oct · background check still pending', sev: 'warn', bgv: true } }) }]
        : [{ label: 'Schedule interview', kind: 'p', on: () => move(c, 'inter', { t: 'Invite sent with Google Meet link. Reminders at 24 h and 1 h.', patch: { note: 'Interview Mon 20 Oct 11:00 · video', sev: 'info' } }) }];
    if (k === 'inter' && c.missed)
      return [
        { label: 'Reschedule', kind: 'p', on: () => { edit('inter', c.id, { missed: false, note: 'Rescheduled to Tue 21 Oct 15:00. Second miss closes the application.', sev: 'info' }); s.say('Rescheduled. One more miss and the application closes automatically.'); } },
        { label: 'Reject', on: () => { drop('inter', c.id); s.say('Candidate told politely, in their language.'); } },
      ];
    if (k === 'inter')
      return [
        {
          label: 'Hire',
          kind: 'p',
          on: () => {
            if (isInt) return s.say('Feedback saved. HR makes the offer.');
            if (c.bgv) return s.say('Offer blocked until the background check clears.');
            move(c, 'offer', { t: 'Offer letter sent for e-sign.', patch: { note: 'Offer sent today. Expires in 5 days.', sev: 'info' } });
          },
        },
        { label: 'Pass', on: () => s.say('Feedback saved for ' + c.name + '.') },
      ];
    if (k === 'offer' && !c.declined)
      return [
        { label: 'Mark joined', kind: 'p', on: () => move(c, 'joined', { t: 'Joined. 30-day replacement guarantee starts today.', patch: { note: 'Joined 18 Oct. Day 1 of 30.', sev: 'ok' } }) },
        { label: 'Extend 3 days', on: () => s.say('Offer extended to 22 Oct.') },
      ];
    if (k === 'offer' && c.declined)
      return [{ label: 'Request replacement', kind: 't', on: () => { drop('offer', c.id); s.say('Free replacement search started. 3 new profiles within 5 days.'); } }];
    return [];
  };

  return (
    <div className="stack g20">
      <PageHead eyebrow="C3 · C4 · C5 · Permanent hiring" title="Restaurant manager · HSR Layout" lead="CrossWay Talent · 30-day replacement · posted 9 Oct">
        {canPost && (
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="button" className="btn btn-tonal" style={{ padding: '0 20px 0 16px' }} onClick={() => s.setModal({ kind: 'post' })}>
            <Icon name="add" />Post a job
          </motion.button>
        )}
      </PageHead>
      <LayoutGroup>
        <div className="pipe">
          {STAGES.map(([k, l]) => (
            <motion.div key={k} layout className="pipe-col">
              <div className="row between" style={{ padding: '4px 6px' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{l}</span>
                <motion.span key={s.pipe[k].length} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="small muted">{s.pipe[k].length}</motion.span>
              </div>
              <AnimatePresence mode="popLayout">
                {s.pipe[k].map(c => (
                  <motion.div
                    key={c.id}
                    layoutId={'cand-' + c.id}
                    className="pipe-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  >
                    <div className="row g10">
                      <div className="initials" style={{ width: 36, height: 36, fontSize: 13 }}>{ini(c.name)}</div>
                      <div className="stack" style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                        <span className="xs muted">{c.sub}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 12.5, color: NFG[c.sev], lineHeight: 1.4 }}>{c.note}</span>
                    <div className="row wrap g6">{actions(k, c).map(a => <Act key={a.label} {...a} />)}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}
