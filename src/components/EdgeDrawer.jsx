import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../ui.jsx';
import { useMotion } from '../motion';

// [module, description, scenario]
const EDGES = [
  ['C1', 'Agreement not e-signed → booking locked', { acct: 'esign', screen: 'home' }],
  ['C1', 'Credit hold → bookings paused until payment', { acct: 'hold', screen: 'book' }],
  ['C2', 'Start time already passed', { screen: 'book', f: { date: 'd0', start: '14', end: '20' } }],
  ['C2', 'Same-day booking under 4 h → surcharge + partial fill', { screen: 'book', f: { date: 'd0', start: '18', end: '0', count: 6 } }],
  ['C2', 'Headcount above local supply', { screen: 'book', f: { role: 'barista', loc: 'HSR Layout', count: 6, date: 'd3', start: '10', end: '18' } }],
  ['C2', 'Shift over 12 h blocked', { screen: 'book', f: { date: 'd3', start: '8', end: '23' } }],
  ['C2', 'Festival peak rate', { screen: 'book', f: { date: 'd4' } }],
  ['C2', 'Booking above role approval limit → owner approval', { role: 'site', screen: 'book', f: { count: 8, date: 'd3', start: '18', end: '0' } }],
  ['C2', "Role that can't book (Finance)", { role: 'finance', screen: 'book' }],
  ['C6', 'Absent worker → free replacement', { screen: 'live' }],
  ['C6', 'Late worker → swap with standby', { screen: 'live' }],
  ['C6', 'Early release and late cancellation fee', { screen: 'live' }],
  ['C6', 'Site QR check-in / check-out, breaks and overruns → you get notified', { screen: 'live' }],
  ['C6', 'Break length: 30 min by default, can only be increased (to 90)', { screen: 'live' }],
  ['C7', "OT not pre-approved can't be bulk approved", { screen: 'timesheets' }],
  ['C7', 'Dispute with hours validation', { screen: 'timesheets' }],
  ['C7', 'Dispute window closed → auto-approved', { screen: 'timesheets' }],
  ['C4', 'Missed interview, BGV-locked offer, declined offer → replacement', { screen: 'hiring' }],
  ['C3', 'Salary below market benchmark', { screen: 'hiring' }],
  ['C8', 'Block worker with reason; unblock', { screen: 'workers' }],
  ['C9', 'Payment fails first, then retry succeeds', { screen: 'invoices' }],
  ['C9', 'Invoice on hold due to dispute', { screen: 'invoices' }],
  ['C10', 'Missing payroll inputs block approval', { screen: 'payroll' }],
  ['C11', 'Document still generating', { screen: 'vault' }],
  ['C13', "Last Account Owner can't be removed", { screen: 'team' }],
  ['RBAC', 'Interviewer sees only Hiring', { role: 'interviewer', screen: 'home' }],
];
export const EDGE_COUNT = EDGES.length;

export default function EdgeDrawer({ s }) {
  const m = useMotion();
  return (
    <AnimatePresence>
      {s.edgeOpen && (
        <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => s.setEdgeOpen(false)}>
          <motion.aside
            className="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={m.spatial('slow')}
            onClick={e => e.stopPropagation()}
          >
            <div className="row between" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Edge cases covered</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => s.setEdgeOpen(false)}><Icon name="close" /></button>
            </div>
            <p className="small muted" style={{ margin: '0 0 12px' }}>Tap one to load that scenario.</p>
            {EDGES.map(([mod, l, p], i) => (
              <motion.button
                key={l}
                type="button"
                className="edge-item"
                onClick={() => s.scenario(p)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...m.spatial(), delay: 0.08 + m.stagger(i) }}
              >
                <span className="tag" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)', marginTop: 1, padding: '3px 8px' }}>{mod}</span>
                <span style={{ fontSize: 14, lineHeight: 1.4 }}>{l}</span>
              </motion.button>
            ))}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
