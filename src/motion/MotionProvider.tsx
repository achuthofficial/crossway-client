import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion, type Transition } from 'motion/react';
import { spring, tokens, type MotionSchemeName, type SpringSpeed } from '../../design-tokens/tokens';

type MotionApi = {
  scheme: MotionSchemeName;
  /** True when the OS asks for reduced motion; spatial motion becomes a simple fade. */
  reduced: boolean;
  /** Spatial spring (position, size, shape). May overshoot in the expressive scheme. */
  spatial: (speed?: SpringSpeed) => Transition;
  /** Effects spring (colour, opacity, elevation). Never overshoots. */
  effects: (speed?: SpringSpeed) => Transition;
  /** Stagger delay in seconds for list item `i`, capped at tokens.stagger.maxItems. */
  stagger: (i: number) => number;
};

const toTransition = (s: ReturnType<typeof spring>): Transition => ({ type: 'spring', ...s });
const FADE: Transition = { duration: tokens.duration.short / 1000, ease: [...tokens.easing.standard] };

function build(scheme: MotionSchemeName, reduced: boolean): MotionApi {
  return {
    scheme,
    reduced,
    spatial: (speed = 'default') => (reduced ? FADE : toTransition(spring(scheme, 'spatial', speed))),
    effects: (speed = 'default') => (reduced ? FADE : toTransition(spring(scheme, 'effects', speed))),
    stagger: i => (reduced ? 0 : (Math.min(i, tokens.stagger.maxItems - 1) * tokens.stagger.interval) / 1000),
  };
}

const Ctx = createContext<MotionApi>(build('expressive', false));

/**
 * Wrap the app once. `scheme` picks the brand feel: 'expressive' (bold, slight overshoot)
 * or 'standard' (calm, critically damped-ish, under ~300 ms). Motion's `reducedMotion="user"`
 * already turns transform and layout animation off when the OS asks; opacity still fades.
 */
export function MotionProvider({ scheme, children }: { scheme: MotionSchemeName; children: ReactNode }) {
  const reduced = !!useReducedMotion();
  const api = useMemo(() => build(scheme, reduced), [scheme, reduced]);
  return (
    <MotionConfig reducedMotion="user" transition={api.spatial()}>
      <Ctx.Provider value={api}>{children}</Ctx.Provider>
    </MotionConfig>
  );
}

export const useMotion = () => useContext(Ctx);
