import { useCallback, useEffect, useRef, useState } from 'react';
import { BOOKINGS, INV, LIVE, NAV, NOTES, PIPE, ROLES, TEAM, TS, WORKERS } from './data.js';
import { BREAK } from './lib/checkinQr.js';

export const OUTLETS = [['Indiranagar', 'STR-IND'], ['Koramangala', 'STR-KOR'], ['HSR Layout', 'STR-HSR']];
const clock = () => new Date().toTimeString().slice(0, 5);

/**
 * What workers do at the site QR, in order. With no backend, "Simulate a scan" (and one automatic
 * event shortly after the portal opens) plays the next step, exactly as the worker app would report it.
 */
const SCAN_SCRIPT = [
  { id: 'l6', kind: 'in', patch: { status: 'On site', sev: 'ok', kind: undefined } },
  { id: 'l1', kind: 'break', patch: { status: 'On break', sev: 'info' } },
  { id: 'l1', kind: 'breakEnd', patch: { status: 'On site', sev: 'ok' } },
  { id: 'l2', kind: 'breakOver', patch: { status: 'Break overrun', sev: 'warn' } },
  { id: 'l2', kind: 'out', patch: { status: 'Checked out', sev: 'mute', kind: 'done' } },
];

const SCREENS = NAV.map(n => n[0]);
const readHash = () => {
  const h = window.location.hash.replace(/^#\/?/, '');
  return SCREENS.includes(h) ? h : 'home';
};

export const DEFAULT_FORM = { role: 'waiter', loc: 'Indiranagar', date: 'd3', start: '18', end: '0', count: 5, recurring: false };

/** All client-portal state and mutations. Pure client-side; resets on reload. */
export function usePortal() {
  const [screen, setScreenRaw] = useState(readHash);
  const [role, setRole] = useState('owner');
  const [acct, setAcct] = useState('active'); // active | esign | hold
  const [esignDone, setEsignDone] = useState(false);
  const [paidAdvance, setPaidAdvance] = useState(false);
  const [f, setForm] = useState(DEFAULT_FORM);
  const [bookings, setBookings] = useState(BOOKINGS);
  const [live, setLive] = useState(LIVE);
  const [ts, setTs] = useState(TS);
  const [pipe, setPipe] = useState(PIPE);
  const [workers, setWorkers] = useState(WORKERS);
  const [inv, setInv] = useState(INV);
  const [pr, setPr] = useState({ inputs: false, approved: false });
  const [team, setTeam] = useState(TEAM);
  const [approvals, setApprovals] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [edgeOpen, setEdgeOpen] = useState(false);
  const toastTimer = useRef();
  // Attendance notifications from site QR scans, and how the client wants to hear about them.
  const [notes, setNotes] = useState(NOTES);
  const [prefs, setPrefs] = useState({ in: true, out: true, breaks: true, desktop: false });
  // Break length per outlet, in minutes. Starts at the default; clients can only lengthen it.
  const [breaks, setBreaks] = useState(() => Object.fromEntries(OUTLETS.map(([o]) => [o, BREAK.defaultMin])));
  const scriptAt = useRef(0);

  const R = ROLES.find(r => r.id === role) || ROLES[0];
  const effAcct = acct === 'esign' && esignDone ? 'active' : acct === 'hold' && paidAdvance ? 'active' : acct;

  const setScreen = useCallback(sc => {
    setScreenRaw(sc);
    if (window.location.hash !== '#/' + sc) window.history.replaceState(null, '', '#/' + sc);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  useEffect(() => {
    const on = () => setScreenRaw(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  useEffect(() => {
    const on = e => {
      if (e.key !== 'Escape') return;
      if (modal) setModal(null);
      else if (edgeOpen) setEdgeOpen(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [modal, edgeOpen]);

  const say = useCallback(msg => {
    clearTimeout(toastTimer.current);
    setToast({ msg, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  const patcher = setter => (id, p) => setter(list => list.map(x => (x.id === id ? { ...x, ...p } : x)));

  const patchLive = patcher(setLive);

  const setBreak = (outlet, min) => {
    const v = Math.max(BREAK.min, Math.min(BREAK.max, min));
    setBreaks(b => ({ ...b, [outlet]: v }));
    return v;
  };

  /** Add an attendance notification: bell + toast, and a desktop alert if the client turned those on. */
  const notify = useCallback((n, prefsNow) => {
    const p = prefsNow || prefs;
    const group = n.kind === 'in' ? 'in' : n.kind === 'out' ? 'out' : 'breaks';
    if (!p[group]) return;
    const note = { ...n, key: Date.now() + Math.random(), time: clock(), read: false };
    setNotes(l => [note, ...l].slice(0, 30));
    say(n.title);
    if (p.desktop && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification('CrossWay · ' + n.title, { body: n.body, tag: 'cw-' + note.key }); } catch { /* blocked */ }
    }
  }, [prefs, say]);

  /** Play the next worker QR event (see SCAN_SCRIPT). Returns false when the script is done. */
  const simulateScan = () => {
    const step = SCAN_SCRIPT[scriptAt.current];
    if (!step) return false;
    scriptAt.current += 1;
    const w = live.find(x => x.id === step.id);
    if (!w) return true;
    const allowed = breaks[w.loc] || BREAK.defaultMin;
    const t = clock();
    const msg = {
      in: [`${w.name} checked in at ${w.loc}`, `Scanned the site QR at ${t} · ${w.role} · shift ${w.time}`, 'qr_code_scanner', 'ok', `Checked in ${t} · site QR`],
      out: [`${w.name} checked out at ${w.loc}`, `Scanned out at ${t}. Timesheet ready for your approval.`, 'logout', 'info', `Checked out ${t} · site QR · timesheet sent`],
      break: [`${w.name} started a break`, `${allowed}-min break at ${w.loc}, back by ${new Date(Date.now() + allowed * 60000).toTimeString().slice(0, 5)}`, 'free_breakfast', 'info', `On break since ${t} · ${allowed} min allowed`],
      breakEnd: [`${w.name} is back from break`, `Break ended at ${t}, within the ${allowed} min allowed`, 'work', 'ok', `Back from break ${t} · within ${allowed} min`],
      breakOver: [`${w.name}'s break is 8 min over`, `Break allowance at ${w.loc} is ${allowed} min. You can message the worker or raise it in the timesheet.`, 'timer_off', 'warn', `Break ${allowed + 8} min · ${allowed} allowed · flagged on the timesheet`],
    }[step.kind];
    patchLive(w.id, { ...step.patch, note: msg[4] });
    notify({ kind: step.kind, title: msg[0], body: msg[1], icon: msg[2], sev: msg[3], who: w.id });
    return true;
  };

  // One live event shortly after the portal opens, so the bell isn't only a demo button.
  const simRef = useRef(simulateScan);
  simRef.current = simulateScan;
  useEffect(() => {
    const t = setTimeout(() => simRef.current(), 15000);
    return () => clearTimeout(t);
  }, []);

  /** Reset to a known scenario; used by the edge-case drawer. */
  const scenario = p => {
    setEdgeOpen(false);
    setRole(p.role || 'owner');
    setAcct(p.acct || 'active');
    setEsignDone(false);
    setPaidAdvance(false);
    if (p.f) setForm(x => ({ ...x, ...p.f }));
    setScreen(p.screen || 'home');
  };

  return {
    screen, setScreen, role, setRole, R, acct, effAcct, setEsignDone, setPaidAdvance, scenario,
    f, setF: p => setForm(x => ({ ...x, ...p })),
    bookings, setBookings,
    live, patchLive,
    notes, setNotes, prefs, setPrefs, notify, simulateScan, scansLeft: () => SCAN_SCRIPT.length - scriptAt.current,
    breaks, setBreak,
    ts, setTs, patchTs: patcher(setTs),
    pipe, setPipe,
    workers, patchWorker: patcher(setWorkers),
    inv, patchInv: patcher(setInv),
    pr, setPr, team, setTeam, approvals, setApprovals,
    modal, setModal, toast, say, edgeOpen, setEdgeOpen,
  };
}
