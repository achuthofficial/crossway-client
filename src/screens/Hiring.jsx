import { useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react';
import { ini, NFG } from '../data.js';
import { Act, Icon, PageHead } from '../ui.jsx';
import { SuccessBurst, useMotion } from '../motion';

const STAGES = [['short', 'Shortlisted'], ['inter', 'Interviewing'], ['offer', 'Offered'], ['joined', 'Hired']];
const ORDER = STAGES.map(x => x[0]);

/** Stage under a viewport point, from the column's data attribute. */
const stageAt = (x, y) => {
  for (const el of document.elementsFromPoint(x, y)) {
    const st = el.closest?.('[data-stage]');
    if (st) return st.dataset.stage;
  }
  return null;
};

function PipeCard({ c, k, actions, onDropTo, onHover, onOpen }) {
  const m = useMotion();
  const x = useMotionValue(0);
  // Tilt follows horizontal drag velocity through a spring, so it settles when the card stops.
  const tilt = useSpring(useTransform(useVelocity(x), v => Math.max(-8, Math.min(8, v / 90))), { stiffness: 380, damping: 30 });
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      layoutId={'cand-' + c.id}
      layout
      className={'pipe-card' + (dragging ? ' dragging' : '')}
      style={{ x, rotate: m.reduced ? 0 : tilt, zIndex: dragging ? 20 : 1, position: 'relative' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={m.spatial()}
      drag
      dragSnapToOrigin
      dragElastic={0.18}
      dragTransition={{ bounceStiffness: 380, bounceDamping: 24 }}
      whileDrag={{ scale: 1.04, cursor: 'grabbing' }}
      onDragStart={() => setDragging(true)}
      onDrag={(e, info) => onHover(stageAt(info.point.x - window.scrollX, info.point.y - window.scrollY))}
      onDragEnd={(e, info) => {
        setDragging(false);
        onHover(null);
        const to = stageAt(info.point.x - window.scrollX, info.point.y - window.scrollY);
        if (to && to !== k) onDropTo(c, k, to);
      }}
      aria-roledescription="Draggable candidate card"
    >
      {/* Lift: elevation fades in while dragging (opacity only). */}
      <motion.span aria-hidden className="m-elevation lift" animate={{ opacity: dragging ? 1 : 0 }} transition={m.effects('fast')} />
      <button type="button" className="pipe-who" onClick={() => onOpen(c)} aria-label={'Open profile of ' + c.name}>
        <motion.div layoutId={'cand-av-' + c.id} className="initials" style={{ width: 36, height: 36, fontSize: 13 }}>{ini(c.name)}</motion.div>
        <div className="stack" style={{ flex: 1, textAlign: 'left' }}>
          <motion.span layoutId={'cand-name-' + c.id} style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</motion.span>
          <span className="xs muted">{c.sub}</span>
        </div>
        <Icon name="drag_indicator" className="muted" />
      </button>
      <span style={{ fontSize: 12.5, color: NFG[c.sev], lineHeight: 1.4 }}>{c.note}</span>
      <div className="row wrap g6">{actions.map(a => <Act key={a.label} {...a} />)}</div>
    </motion.div>
  );
}

function Profile({ c, onClose }) {
  const m = useMotion();
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={m.effects()} onClick={onClose}>
      <motion.div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={'pf-' + c.id}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={m.spatial()}
        onClick={e => e.stopPropagation()}
      >
        <div className="row g16">
          {/* Shared elements: the avatar and name travel from the card into the profile. */}
          <motion.div layoutId={'cand-av-' + c.id} className="initials" style={{ width: 72, height: 72, borderRadius: 36, fontSize: 24 }}>{ini(c.name)}</motion.div>
          <div className="stack g4">
            <motion.span layoutId={'cand-name-' + c.id} id={'pf-' + c.id} style={{ fontSize: 24 }}>{c.name}</motion.span>
            <span className="muted">{c.sub}</span>
          </div>
        </div>
        <motion.div className="stack g8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...m.effects(), delay: 0.12 }}>
          {[['work_history', 'Experience', c.sub], ['psychology', 'AI interview', 'Scorecard 4.2/5 · communication strong, inventory planning average'], ['verified_user', 'Checks', c.bgv ? 'Background check pending' : 'KYC and background verified'], ['notes', 'Latest', c.note]].map(([i, k, v]) => (
            <div key={k} className="row g12 start" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <Icon name={i} className="muted" />
              <div className="stack"><span style={{ fontSize: 14, fontWeight: 500 }}>{k}</span><span className="small muted">{v}</span></div>
            </div>
          ))}
        </motion.div>
        <div className="row g8" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-filled" onClick={onClose}>Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Hiring({ s }) {
  const m = useMotion();
  const isInt = s.role === 'interviewer';
  const canPost = !isInt && s.effAcct === 'active';
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState(null);
  const [hiredAt, setHiredAt] = useState(0);
  const lastHover = useRef(null);

  const move = (c, to, { t, patch }) => {
    s.setPipe(p => {
      const n = {};
      for (const k in p) n[k] = p[k].filter(x => x.id !== c.id);
      n[to] = [...n[to], { ...c, ...patch, st: to }];
      return n;
    });
    if (to === 'joined') setHiredAt(Date.now());
    s.say(t);
  };
  const edit = (k, id, patch) => s.setPipe(p => ({ ...p, [k]: p[k].map(x => (x.id === id ? { ...x, ...patch } : x)) }));
  const drop = (k, id) => s.setPipe(p => ({ ...p, [k]: p[k].filter(x => x.id !== id) }));

  const toInterview = c =>
    c.bgv
      ? move(c, 'inter', { t: 'Interview booked. Offer stays locked until her check clears.', patch: { note: 'Interview Tue 21 Oct · background check still pending', sev: 'warn', bgv: true } })
      : move(c, 'inter', { t: 'Invite sent with Google Meet link. Reminders at 24 h and 1 h.', patch: { note: 'Interview Mon 20 Oct 11:00 · video', sev: 'info' } });
  const toOffer = c => {
    if (isInt) return s.say('Feedback saved. HR makes the offer.');
    if (c.missed) return s.say('Reschedule the missed interview first.');
    if (c.bgv) return s.say('Offer blocked until the background check clears.');
    move(c, 'offer', { t: 'Offer letter sent for e-sign.', patch: { note: 'Offer sent today. Expires in 5 days.', sev: 'info' } });
  };
  const toHired = c => {
    if (c.declined) return s.say('This offer was declined. Request a free replacement instead.');
    move(c, 'joined', { t: 'Hired. 30-day replacement guarantee starts today.', patch: { note: 'Joined 18 Oct. Day 1 of 30.', sev: 'ok' } });
  };

  /** Drag-and-drop uses the same rules as the buttons: one stage forward at a time. */
  const onDropTo = (c, from, to) => {
    const step = ORDER.indexOf(to) - ORDER.indexOf(from);
    if (step < 0) return s.say("Candidates don't move backwards. Use Reject or Pass instead.");
    if (step > 1) return s.say('Move one stage at a time so nothing is skipped.');
    if (to === 'inter') toInterview(c);
    else if (to === 'offer') toOffer(c);
    else if (to === 'joined') toHired(c);
  };

  const actions = (k, c) => {
    if (k === 'short') return [{ label: 'Schedule interview', kind: 'p', on: () => toInterview(c) }];
    if (k === 'inter' && c.missed)
      return [
        { label: 'Reschedule', kind: 'p', on: () => { edit('inter', c.id, { missed: false, note: 'Rescheduled to Tue 21 Oct 15:00. Second miss closes the application.', sev: 'info' }); s.say('Rescheduled. One more miss and the application closes automatically.'); } },
        { label: 'Reject', on: () => { drop('inter', c.id); s.say('Candidate told politely, in their language.'); } },
      ];
    if (k === 'inter') return [{ label: 'Hire', kind: 'p', on: () => toOffer(c) }, { label: 'Pass', on: () => s.say('Feedback saved for ' + c.name + '.') }];
    if (k === 'offer' && !c.declined) return [{ label: 'Mark hired', kind: 'p', on: () => toHired(c) }, { label: 'Extend 3 days', on: () => s.say('Offer extended to 22 Oct.') }];
    if (k === 'offer' && c.declined) return [{ label: 'Request replacement', kind: 't', on: () => { drop('offer', c.id); s.say('Free replacement search started. 3 new profiles within 5 days.'); } }];
    return [];
  };

  const onHover = st => {
    if (st === lastHover.current) return;
    lastHover.current = st;
    setHover(st);
  };

  return (
    <div className="stack g20">
      <PageHead eyebrow="C3 · C4 · C5 · Permanent hiring" title="Restaurant manager · HSR Layout" lead="CrossWay Talent · 30-day replacement · posted 9 Oct · drag cards to move them forward">
        {canPost && (
          <motion.button whileTap={{ scale: 0.97 }} type="button" className="btn btn-tonal" style={{ padding: '0 20px 0 16px' }} onClick={() => s.setModal({ kind: 'post' })}>
            <Icon name="add" />Post a job
          </motion.button>
        )}
      </PageHead>
      <LayoutGroup>
        <div className="pipe">
          {STAGES.map(([k, l]) => (
            <motion.div key={k} layout data-stage={k} className={'pipe-col' + (hover === k ? ' drop-target' : '') + (k === 'joined' ? ' hired' : '')} transition={m.spatial()}>
              <div className="row between" style={{ padding: '4px 6px', position: 'relative' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{l}</span>
                <motion.span key={s.pipe[k].length} initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={m.spatial('fast')} className="small muted">{s.pipe[k].length}</motion.span>
                {k === 'joined' && <SuccessBurst trigger={hiredAt || null} style={{ left: '50%', top: 40 }} />}
              </div>
              <AnimatePresence mode="popLayout">
                {s.pipe[k].map(c => (
                  <PipeCard key={c.id} c={c} k={k} actions={actions(k, c)} onDropTo={onDropTo} onHover={onHover} onOpen={setOpen} />
                ))}
                {/* Placeholder opens space in the target column so neighbours reflow before the drop. */}
                {hover === k && (
                  <motion.div key="ph" layout className="pipe-placeholder" initial={{ opacity: 0, scaleY: 0.6 }} animate={{ opacity: 1, scaleY: 1 }} exit={{ opacity: 0 }} transition={m.spatial('fast')} />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>{open && <Profile key={open.id} c={open} onClose={() => setOpen(null)} />}</AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
