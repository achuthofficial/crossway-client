import { useCallback, useEffect, useRef, useState } from 'react';
import { BOOKINGS, INV, LIVE, NAV, PIPE, ROLES, TEAM, TS, WORKERS } from './data.js';

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
    live, patchLive: patcher(setLive),
    ts, setTs, patchTs: patcher(setTs),
    pipe, setPipe,
    workers, patchWorker: patcher(setWorkers),
    inv, patchInv: patcher(setInv),
    pr, setPr, team, setTeam, approvals, setApprovals,
    modal, setModal, toast, say, edgeOpen, setEdgeOpen,
  };
}
