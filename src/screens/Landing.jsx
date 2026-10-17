import { useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AV } from '../data.js';
import { Icon } from '../ui.jsx';
import { useMotion, tokens } from '../motion';

gsap.registerPlugin(ScrollTrigger);

// The talent CrossWay brings in, from blue-collar to MNC roles.
const PEOPLE = [
  ['RK', 'Driver'], ['SK', 'Cleaner'], ['DR', 'Waiter'], ['AM', 'Data scientist'], ['FK', 'Cook'], ['PN', 'Analyst'],
  ['LD', 'Housekeeping'], ['VG', 'Picker'], ['SI', 'ML engineer'], ['KB', 'Barista'], ['RT', 'Cashier'], ['MI', 'Loader'],
];
const STAGES = ['Shortlisted', 'Interviewing', 'Offered', 'Hired'];
const STEPS = [
  ['Every kind of talent, verified', 'Drivers, cleaners and cooks sit next to data scientists. Everyone is KYC-checked before you ever see them.'],
  ['Matched into your pipeline', 'CrossWay ranks people on skills, distance and reliability, and drops the best fits straight into Shortlisted.'],
  ['Interviews without the chasing', 'AI screening, reminders and rescheduling move candidates forward while your team focuses on decisions.'],
  ['Hired, and guaranteed', 'Offers go out for e-sign. If a hire leaves in 30 days, the replacement is on us.'],
];

/**
 * Scroll-driven story (GSAP ScrollTrigger, scrubbed): candidates flow from the talent pool
 * into the company's pipeline and advance column by column as the reader scrolls.
 * Only transforms and opacity are animated. Reduced motion shows the finished board, no pinning.
 */
export default function Landing({ onEnter }) {
  const m = useMotion();
  const root = useRef(null);
  const stage = useRef(null);

  useLayoutEffect(() => {
    if (m.reduced) return;
    const ctx = gsap.context(() => {
      const chips = gsap.utils.toArray('.lp-chip');
      const caps = gsap.utils.toArray('.lp-cap');
      const st = stage.current;
      // Target positions are functions so ScrollTrigger recomputes them on resize.
      const col = i => st.querySelectorAll('.lp-col')[i];
      // Chips are absolutely positioned inside the board, so measure against it.
      const board = st.querySelector('.lp-board');
      const rel = el => {
        const b = board.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { x: r.left - b.left, y: r.top - b.top, w: r.width };
      };
      const slot = (c, k) => {
        const r = rel(col(c));
        return { x: r.x + 8, y: r.y + 40 + k * 40 };
      };
      const pool = i => {
        const r = rel(st.querySelector('.lp-pool'));
        const w = (r.w - 16) / 2;
        return { x: r.x + 8 + (i % 2) * w, y: r.y + 40 + Math.floor(i / 2) * 40 };
      };

      chips.forEach((el, i) => gsap.set(el, { x: pool(i).x, y: pool(i).y }));
      gsap.set(caps, { autoAlpha: 0, y: 16 });
      gsap.set(caps[0], { autoAlpha: 1, y: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: st, start: 'top top+=24', end: '+=2400', scrub: 0.6, pin: true, invalidateOnRefresh: true },
      });
      const cap = i => tl.to(caps[i - 1], { autoAlpha: 0, y: -16, duration: 0.3 }).to(caps[i], { autoAlpha: 1, y: 0, duration: 0.3 }, '<0.1');

      // Phase 1: six of the twelve move from the pool into Shortlisted; the rest dim.
      cap(1);
      chips.forEach((el, i) => {
        if (i < 6) tl.to(el, { x: () => slot(0, i).x, y: () => slot(0, i).y, duration: 1 }, i === 0 ? '<' : '<0.06');
      });
      tl.to(chips.slice(6), { opacity: 0.35, duration: 0.6 }, '<');
      // Phase 2: four advance to Interviewing.
      cap(2);
      [0, 1, 2, 3].forEach((i, k) => tl.to(chips[i], { x: () => slot(1, k).x, y: () => slot(1, k).y, duration: 0.8 }, k ? '<0.08' : '<'));
      // Phase 3: two get offers.
      cap(3);
      [0, 1].forEach((i, k) => tl.to(chips[i], { x: () => slot(2, k).x, y: () => slot(2, k).y, duration: 0.8 }, k ? '<0.08' : '<'));
      // Phase 4: hired, with a single (non-flashing) pop on the Hired column.
      tl.to(chips[0], { x: () => slot(3, 0).x, y: () => slot(3, 0).y, duration: 0.8 });
      tl.to(chips[1], { x: () => slot(3, 1).x, y: () => slot(3, 1).y, duration: 0.8 }, '<0.1');
      tl.fromTo('.lp-col.hired', { scale: 1 }, { scale: 1.04, duration: 0.2, yoyo: true, repeat: 1 }, '>-0.1');
      tl.to('.lp-hired-count', { innerText: 2, snap: { innerText: 1 }, duration: 0.3 }, '<');
    }, root);
    return () => ctx.revert();
  }, [m.reduced]);

  return (
    <div className="lp" ref={root}>
      <header className="lp-top">
        <div className="row g12">
          <div className="rail-logo" style={{ marginBottom: 0 }}><Icon name="alt_route" size={24} /></div>
          <b style={{ fontSize: 20, fontWeight: 500 }}>CrossWay for Business</b>
        </div>
        <button type="button" className="btn btn-filled" onClick={onEnter}>Open portal<Icon name="arrow_forward" /></button>
      </header>

      <section className="lp-hero">
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={m.spatial('slow')}>
          Hire anyone, from drivers to data scientists.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...m.spatial('slow'), delay: 0.08 }}>
          Shift staff by tonight, permanent hires in days. One verified talent network, one pipeline.
        </motion.p>
        <motion.div className="row g8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...m.effects(), delay: 0.2 }}>
          <button type="button" className="btn btn-filled" onClick={onEnter}>Open portal</button>
          <span className="lp-scroll-hint"><Icon name="south" />Scroll to see how it works</span>
        </motion.div>
      </section>

      <section className={'lp-stage' + (m.reduced ? ' static' : '')} ref={stage} aria-label="How candidates flow into your pipeline">
        <div className="lp-captions" aria-live="polite">
          {STEPS.map(([h, p], i) => (
            <div className="lp-cap" key={h} style={m.reduced ? { position: 'static', opacity: 1 } : undefined}>
              <span className="eyebrow">Step {i + 1} of 4</span>
              <h2>{h}</h2>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <div className="lp-board">
          <div className="lp-pool"><span>Talent pool</span></div>
          {STAGES.map((l, i) => (
            <div className={'lp-col' + (i === 3 ? ' hired' : '')} key={l}>
              <span>{l}{i === 3 && <> · <b className="lp-hired-count">{m.reduced ? 2 : 0}</b></>}</span>
            </div>
          ))}
          {PEOPLE.map(([ini, role], i) => (
            <div
              className="lp-chip"
              key={ini + role}
              style={m.reduced ? { position: 'static' } : undefined}
            >
              <span className="lp-av" style={{ background: AV[i % AV.length] }}>{ini}</span>
              <span>{role}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-end">
        <h2>Ready when your next shift is.</h2>
        <p>Book staff in two minutes, or post a permanent role with a 30-day replacement guarantee.</p>
        <button type="button" className="btn btn-filled" onClick={onEnter}>Open portal<Icon name="arrow_forward" /></button>
        <p className="xs muted" style={{ marginTop: 24 }}>Motion follows Material 3 Expressive · stagger {tokens.stagger.interval} ms</p>
      </section>
    </div>
  );
}
