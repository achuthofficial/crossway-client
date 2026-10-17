import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AV, ini, NFG } from '../data.js';
import { Act, Icon, itemVariants, PageHead, Stagger, Tag } from '../ui.jsx';
import { useMotion } from '../motion';
import { SkeletonShimmer, useFirstLoad } from '../motion';

/* ---------------- C6 Live workforce ---------------- */
export function Live({ s }) {
  const loading = useFirstLoad('live');
  const actions = w => {
    const a = [];
    if (w.kind === 'absent')
      a.push({ label: 'Get replacement', kind: 'p', on: () => { s.patchLive(w.id, { status: 'Replacement', sev: 'info', name: 'Sanjay V.', note: 'Replacement accepted. ETA 14 min. Free under the no-show guarantee.', kind: 'enroute' }); s.say('Replacement booked at no charge.'); } });
    if (w.kind === 'late')
      a.push(
        { label: 'Swap now', kind: 'p', on: () => { s.patchLive(w.id, { status: 'Replacement', sev: 'info', name: 'Fatima K.', note: 'Standby Fatima K. sent. ETA 11 min. Kiran B. released without penalty to you.', kind: 'enroute' }); s.say("Standby sent. You're billed only from her check-in."); } },
        { label: 'Wait 15 min', on: () => s.say("We'll keep the standby on hold until 16:35.") },
      );
    if (w.sev === 'ok')
      a.push({ label: 'Release early', on: () => { s.patchLive(w.id, { status: 'Released', sev: 'mute', note: 'Released early at ' + new Date().toTimeString().slice(0, 5) + ". Worker paid a minimum 4 h; you're billed the same.", kind: 'done' }); s.say("Early release recorded, so hours won't be disputed later."); } });
    if (w.kind === 'upcoming')
      a.push({ label: 'Cancel', on: () => { s.patchLive(w.id, { status: 'Cancelled', sev: 'bad', note: 'Cancelled inside 4 h: 50% fee applies. Worker gets the cancellation pay.', kind: 'done' }); s.say('Cancelled. 50% late-cancellation fee applies.'); } });
    return a;
  };
  const cnt = st => s.live.filter(w => w.status === st).length;
  const stats = [['On site', cnt('On site'), '#34A853', 'var(--ok-bg)', 'var(--ok-fg)'], ['Late', cnt('Late'), '#FBBC04', 'var(--warn-bg)', 'var(--warn-fg)'], ['Absent', cnt('Absent'), '#EA4335', 'var(--bad-bg)', 'var(--bad-fg)'], ['Replacing', cnt('Replacement'), '#4285F4', 'var(--primary-soft)', 'var(--primary-dark)']];

  return (
    <div className="stack g20">
      <PageHead eyebrow="C6 · Live workforce" title="Who's on site now" />
      <div className="row wrap g8">
        {stats.map(([l, n, dot, bg, fg]) => (
          <motion.div key={l} layout className="row g8" style={{ height: 36, padding: '0 14px', borderRadius: 18, background: bg, color: fg, fontSize: 14, fontWeight: 500 }}>
            <span className={l === 'On site' ? 'live-dot' : 'legend-dot'} style={{ width: 8, height: 8, background: dot }} />
            <motion.span key={n} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{n}</motion.span> {l}
          </motion.div>
        ))}
      </div>
      <SkeletonShimmer loading={loading} lines={3} height={96} style={{ border: '1px solid var(--line)', borderRadius: 20 }}>
        <Stagger className="fill-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))' }}>
        {s.live.map((w, i) => (
          <motion.div key={w.id} layout variants={itemVariants} className="card20" style={{ padding: 16, gap: 10 }}>
            <div className="row g12">
              <AnimatePresence mode="wait">
                <motion.div key={w.name} className="av" style={{ width: 44, height: 44, borderRadius: 22, background: AV[i % AV.length] }} initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} exit={{ rotateY: -90 }}>
                  {ini(w.name)}
                </motion.div>
              </AnimatePresence>
              <div className="stack" style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{w.name}</span>
                <span className="small muted">{w.role} · {w.loc} · {w.time}</span>
              </div>
              <motion.span key={w.status} initial={{ scale: 0.6 }} animate={{ scale: 1 }}><Tag sev={w.sev} lg>{w.status}</Tag></motion.span>
            </div>
            <span className="small" style={{ color: NFG[w.sev], lineHeight: 1.45 }}>{w.note}</span>
            <div className="row wrap g6">{actions(w).map(a => <Act key={a.label} {...a} />)}</div>
          </motion.div>
        ))}
      </Stagger>
      </SkeletonShimmer>
    </div>
  );
}

/* ---------------- C7 Timesheets ---------------- */
export function Timesheets({ s }) {
  const m = useMotion();
  const [sel, setSel] = useState({});
  const open = s.ts.filter(t => !t.done);
  const clean = open.filter(t => !t.locked && !t.ot && t.sev === 'ok');
  const selCount = clean.filter(t => sel[t.id]).length;
  const allSel = clean.length > 0 && selCount === clean.length;

  const done = (id, msg) => { s.patchTs(id, { done: true }); s.say(msg); };
  const bulk = () => {
    const ids = clean.filter(t => sel[t.id]).map(t => t.id);
    s.setTs(list => list.map(t => (ids.includes(t.id) ? { ...t, done: true } : t)));
    setSel({});
    s.say(ids.length + ' timesheets approved. Workers paid tonight.');
  };

  return (
    <div className="stack g20">
      <PageHead eyebrow="C7 · Attendance approval" title="Timesheets to approve" lead="You have 48 hours to approve or dispute. After that they approve automatically.">
        <motion.button whileTap={{ scale: 0.96 }} type="button" className="btn btn-filled" disabled={!selCount} onClick={bulk}>
          Approve {selCount} selected
        </motion.button>
      </PageHead>
      {!open.length ? (
        <motion.div className="banner ok" style={{ padding: 32, borderRadius: 20, fontSize: 16, alignItems: 'center' }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <motion.span initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ ...m.spatial('fast'), delay: 0.15 }}><Icon name="task_alt" /></motion.span>
          All caught up. Nothing waiting for you.
        </motion.div>
      ) : (
        <div className="list20">
          <label className="list-row small muted" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={allSel} onChange={() => { const n = {}; clean.forEach(t => (n[t.id] = !allSel)); setSel(n); }} style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
            <span>Select all clean timesheets</span>
          </label>
          <AnimatePresence initial={false}>
            {open.map(t => {
              const lock = !!t.locked || t.ot || t.sev === 'mute';
              return (
                <motion.div
                  key={t.id}
                  layout
                  className="list-row"
                  style={{ padding: '14px 18px', overflow: 'hidden' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0, transition: m.spatial('fast') }}
                >
                  <input type="checkbox" checked={!!sel[t.id]} disabled={lock} onChange={() => setSel(x => ({ ...x, [t.id]: !x[t.id] }))} style={{ width: 18, height: 18, accentColor: 'var(--brand)' }} />
                  <div className="stack" style={{ flex: '1 1 200px' }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{t.name}</span>
                    <span className="small muted">{t.role} · {t.loc} · {t.date}</span>
                  </div>
                  <div className="small muted" style={{ flex: '1 1 170px' }}>{t.inout}<br /><span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{t.hours}</span></div>
                  <span className="small" style={{ flex: '2 1 220px', color: NFG[t.sev] }}>{t.note}</span>
                  {!t.locked && (
                    <div className="row g6">
                      {t.ot && <Act kind="p" label="Approve OT" on={() => done(t.id, 'Overtime approved at 2× rate.')} />}
                      {t.ot && <Act label="Pay 8 h only" on={() => done(t.id, 'Approved 8 h. CrossWay will speak to the worker about unapproved OT.')} />}
                      <Act label="Dispute" on={() => s.setModal({ kind: 'dispute', id: t.id })} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ---------------- C8 Workers ---------------- */
export function Workers({ s }) {
  const m = useMotion();
  const loading = useFirstLoad('workers');
  return (
    <div className="stack g20">
      <PageHead
        eyebrow="C8 · C14 · Ratings and talent pools"
        title="Workers you've had"
        lead="Favourites are offered your shifts first. Blocked workers are never sent to you again; it doesn't affect pay for shifts they already worked."
      />
      <SkeletonShimmer loading={loading} lines={5} height={64} style={{ border: '1px solid var(--line)', borderRadius: 20 }}>
        <Stagger className="list20">
        {s.workers.map((w, i) => (
          <motion.div key={w.id} variants={itemVariants} className="list-row" animate={{ opacity: w.blocked ? 0.55 : 1 }}>
            <div className="av" style={{ background: AV[i % AV.length] }}>{ini(w.name)}</div>
            <div className="stack" style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{w.name}</span>
              <span className="small muted">{w.role} · {w.shifts} shifts with you · reliability {w.rel}</span>
            </div>
            <div className="row" style={{ gap: 2 }} role="radiogroup" aria-label={'Rate ' + w.name}>
              {[1, 2, 3, 4, 5].map(n => (
                <motion.button
                  key={n}
                  type="button"
                  className="star"
                  disabled={w.blocked}
                  aria-label={n + ' star'}
                  whileHover={{ scale: 1.25, rotate: 8 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => { s.patchWorker(w.id, { rating: n }); if (n <= 2) s.say('Rated ' + n + '★. Tell us why so ops can follow up.'); }}
                  style={{ color: n <= w.rating ? '#FBBC04' : 'var(--line)' }}
                >
                  <motion.span key={n <= w.rating ? 'on' : 'off'} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={'icon' + (n <= w.rating ? ' fill1' : '')}>star</motion.span>
                </motion.button>
              ))}
            </div>
            <motion.button
              type="button"
              className="icon-btn"
              title="Favourite"
              disabled={w.blocked}
              whileTap={{ scale: 0.7 }}
              onClick={() => s.patchWorker(w.id, { fav: !w.fav })}
              style={{ color: w.fav ? '#EA4335' : 'var(--muted)' }}
            >
              <motion.span key={String(w.fav)} initial={{ scale: w.fav ? 1.6 : 0.8 }} animate={{ scale: 1 }} transition={m.spatial('fast')} className={'icon' + (w.fav ? ' fill1' : '')}>
                favorite
              </motion.span>
            </motion.button>
            <button
              type="button"
              className="btn sm btn-outline"
              style={{ color: w.blocked ? 'var(--brand)' : 'var(--danger)' }}
              onClick={() => (w.blocked ? (s.patchWorker(w.id, { blocked: false }), s.say(w.name + ' unblocked.')) : s.setModal({ kind: 'block', id: w.id }))}
            >
              {w.blocked ? 'Unblock' : 'Block'}
            </button>
          </motion.div>
        ))}
      </Stagger>
      </SkeletonShimmer>
    </div>
  );
}
