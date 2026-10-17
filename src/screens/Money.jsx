import { motion } from 'motion/react';
import { NFG, T } from '../data.js';
import { CountUp, Fill, Icon, itemVariants, PageHead, Stagger, Tag } from '../ui.jsx';

/* ---------------- C9 Invoices ---------------- */
export function Invoices({ s }) {
  const out = s.inv.filter(i => i.pay).reduce((a, i) => a + i.v, 0);
  const cp = Math.round((out / 200000) * 100);
  const bar = cp >= 100 ? '#B3261E' : cp >= 80 ? '#F9AB00' : '#0B57D0';
  const outText = '₹' + out.toLocaleString('en-IN');

  return (
    <div className="stack g20">
      <PageHead eyebrow="C9 · Invoices and payments" title="Invoices" />
      <Stagger className="auto-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <motion.div variants={itemVariants} className="stack g4" style={{ borderRadius: 20, padding: 18, background: 'var(--surface-2)' }}>
          <span className="small muted">Outstanding</span>
          <span style={{ fontSize: 28 }}><CountUp key={outText} value={outText} /></span>
        </motion.div>
        <motion.div variants={itemVariants} className="stack g6" style={{ borderRadius: 20, padding: 18, background: 'var(--surface-2)' }}>
          <span className="small muted">Credit used</span>
          <span style={{ fontSize: 28 }}><CountUp key={cp} value={Math.min(cp, 120) + '%'} /></span>
          <div className="track" style={{ background: '#fff' }}><Fill width={Math.min(cp, 100) + '%'} color={bar} /></div>
        </motion.div>
        <motion.div variants={itemVariants} className="stack g4" style={{ borderRadius: 20, padding: 18, background: 'var(--surface-2)' }}>
          <span className="small muted">Terms</span>
          <span style={{ fontSize: 20 }}>Net 15 · ₹2,00,000 limit</span>
        </motion.div>
      </Stagger>
      <Stagger className="list20">
        {s.inv.map(i => (
          <motion.div key={i.id} layout variants={itemVariants} className="list-row" style={{ padding: '14px 18px' }}>
            <Icon name={i.no.startsWith('CN') ? 'receipt' : 'description'} className="muted" />
            <div className="stack" style={{ flex: '1 1 200px' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{i.no}</span>
              <span className="small muted">{i.desc}</span>
            </div>
            <span style={{ flex: '0 0 110px', fontSize: 15, textAlign: 'right' }}>{i.amt}</span>
            <motion.span key={i.status} initial={{ scale: 0.6 }} animate={{ scale: 1 }}><Tag sev={i.sev} lg>{i.status}</Tag></motion.span>
            <div className="row g6">
              <motion.button
                whileHover={{ y: 2 }}
                type="button"
                className="icon-btn muted"
                title="Download GST invoice"
                onClick={() => s.say('Downloading GST invoice ' + i.no + ' (PDF, e-invoice IRN included).')}
              >
                <Icon name="download" />
              </motion.button>
              {i.pay && (
                <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn md btn-filled" onClick={() => s.setModal({ kind: 'pay', id: i.id })}>Pay</motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </Stagger>
    </div>
  );
}

/* ---------------- C10 Payroll ---------------- */
export function Payroll({ s }) {
  const { pr, setPr, R } = s;
  const steps = [
    { l: 'Attendance inputs', s: pr.inputs ? '18 of 18 uploaded' : '16 of 18 uploaded · missing: Sameer P., Anitha K.', done: pr.inputs, warn: !pr.inputs, act: 'Upload missing', on: () => { setPr({ ...pr, inputs: true }); s.say('2 inputs uploaded. Payroll recomputed.'); } },
    { l: 'Computed by CrossWay', s: pr.inputs ? 'Gross ₹6,48,200 · PF ₹38,410 · ESI ₹4,860 · PT ₹3,600' : 'Waiting for inputs', done: pr.inputs },
    { l: 'Your approval', s: pr.approved ? 'Approved by ' + R.label : pr.inputs ? 'Ready for your approval' : 'Locked until inputs are complete', done: pr.approved, act: 'Approve payroll', dis: !pr.inputs, on: () => { setPr({ ...pr, approved: true }); s.say('Payroll approved. Salaries credit on 1 Nov.'); } },
    { l: 'Payslips and challans', s: pr.approved ? 'Available on 1 Nov' : 'After approval', done: false },
  ];
  return (
    <div className="stack g20" style={{ maxWidth: 900 }}>
      <PageHead eyebrow="C10 · Payroll portal" title="October payroll" lead="18 permanent staff on CrossWay Payroll · cut-off 25 Oct · salaries credited 1 Nov" />
      <Stagger className="list20">
        {steps.map(p => {
          const bg = p.done ? '#0B57D0' : p.warn ? '#FEEFC3' : '#E9EEF6';
          const fg = p.done ? '#fff' : p.warn ? '#594300' : '#444746';
          return (
            <motion.div key={p.l} variants={itemVariants} className="list-row" style={{ padding: '16px 18px' }}>
              <motion.div
                className="step-dot"
                style={{ width: 32, height: 32, borderRadius: 16 }}
                animate={{ backgroundColor: bg, color: fg, scale: p.done ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.4 }}
              >
                <Icon name={p.done ? 'check' : p.warn ? 'priority_high' : 'circle'} />
              </motion.div>
              <div className="stack" style={{ flex: '1 1 240px' }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{p.l}</span>
                <span className="small" style={{ color: p.warn ? '#7A5900' : '#444746' }}>{p.s}</span>
              </div>
              {p.act && !p.done && (
                <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn md btn-filled" disabled={p.dis} onClick={p.on}>{p.act}</motion.button>
              )}
            </motion.div>
          );
        })}
      </Stagger>
    </div>
  );
}

/* ---------------- C11 Vault ---------------- */
const DOCS = [
  ['groups', 'Contract labour register · Sep', 'Form XIII · 3 outlets', 'ok', 'Download'],
  ['receipt_long', 'PF ECR + ESI challans · Sep', 'Paid 14 Oct', 'ok', 'Download'],
  ['badge', 'Worker KYC + BGV pack', '86 workers · 2 police verifications expired', 'warn', 'Download'],
  ['description', 'Wage register · Oct', 'Generating after payroll approval', 'mute', 'Generating…'],
  ['verified', 'Contract labour licence', 'Valid to 31 Mar 2027', 'ok', 'View'],
];

export function Vault({ s }) {
  return (
    <div className="stack g20">
      <PageHead eyebrow="C11 · Compliance vault" title="Audit-ready documents" />
      <Stagger className="fill-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
        {DOCS.map(([icon, t, sub, sv, act]) => (
          <motion.div key={t} variants={itemVariants} whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,.06)' }} className="card20" style={{ padding: 16, gap: 10 }}>
            <div className="icon-circle" style={{ width: 40, height: 40, borderRadius: 12, background: T[sv][0], color: T[sv][1] }}><Icon name={icon} /></div>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{t}</span>
            <span className="small" style={{ color: NFG[sv], lineHeight: 1.4 }}>{sub}</span>
            <button type="button" className="btn sm btn-outline" style={{ alignSelf: 'flex-start' }} disabled={sv === 'mute'} onClick={() => s.say('Downloading ' + t + '.')}>
              {sv === 'mute' && <span className="spinner" style={{ borderColor: 'rgba(11,87,208,.3)', borderTopColor: '#0B57D0' }} />}
              {act}
            </button>
          </motion.div>
        ))}
      </Stagger>
    </div>
  );
}
