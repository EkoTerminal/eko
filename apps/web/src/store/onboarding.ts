import { create } from 'zustand';
import { DEFAULT_ONBOARDING, type OnboardingPrefs, type Preferences } from '@eko/shared';

/**
 * Onboarding, help and first-run guidance. UI anywhere in the app talks to onboarding only
 * through this store; the onboarding components render from it.
 *
 * Tour anchors: elements the guided tour points at carry `data-tour="<TourAnchor>"`.
 *
 * Persistence: progress lives in the user's preferences (`preferences.onboarding`, saved through
 * useApp.setPreferences) and is mirrored to localStorage, so it survives a failed server write.
 * Every flag only ever goes false → true, so hydration merges the two copies with OR.
 */
export type TourAnchor = 'markets' | 'chart' | 'amount' | 'trade' | 'positions' | 'mode-switch' | 'wallet' | 'help';

export type ChecklistStep = 'paper_trade' | 'close_position' | 'go_live';

export const CHECKLIST_STEPS: ChecklistStep[] = ['paper_trade', 'close_position', 'go_live'];
/** Steps that make up "getting started"; going live is optional. */
export const REQUIRED_STEPS: ChecklistStep[] = ['paper_trade', 'close_position'];

/**
 * Bump when the tour or welcome changes meaningfully: users who finished an older version are
 * offered the new tour once (they are never shown the welcome again).
 */
export const ONBOARDING_VERSION = 3;

/** localStorage key; value 'off' disables all automatic onboarding (used by e2e tests). */
export const ONBOARDING_LS = 'eko.onboarding';
/** localStorage mirror of the persisted progress (fallback when the server can't be reached). */
const LS_STATE = 'eko.onboarding.state';
/** UI-only: whether the checklist is expanded rather than a pill (a per-device convenience, not progress). */
const LS_OPEN = 'eko.onboarding.checklistOpen';

/** Browser storage, or null outside a browser / when blocked. */
function store(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readDisabled(): boolean {
  try {
    return store()?.getItem(ONBOARDING_LS) === 'off';
  } catch {
    return false;
  }
}

function readLocal(): Partial<OnboardingPrefs> {
  try {
    const v = JSON.parse(store()?.getItem(LS_STATE) ?? '{}');
    return v && typeof v === 'object' ? (v as Partial<OnboardingPrefs>) : {};
  } catch {
    return {};
  }
}

function readOpen(): boolean {
  try {
    return store()?.getItem(LS_OPEN) === '1';
  } catch {
    return false;
  }
}

const EMPTY_CHECKLIST: Record<ChecklistStep, boolean> = { paper_trade: false, close_position: false, go_live: false };

/** OR-merge progress from several sources (server, localStorage). Unknown/invalid values are ignored. */
export function mergeProgress(...sources: (Partial<OnboardingPrefs> | null | undefined)[]): OnboardingPrefs {
  const out: OnboardingPrefs = { ...DEFAULT_ONBOARDING, checklist: { ...EMPTY_CHECKLIST } };
  for (const s of sources) {
    if (!s || typeof s !== 'object') continue;
    if (typeof s.version === 'number' && Number.isFinite(s.version)) out.version = Math.max(out.version, Math.floor(s.version));
    out.welcomeDone ||= s.welcomeDone === true;
    out.tourDone ||= s.tourDone === true;
    out.checklistDismissed ||= s.checklistDismissed === true;
    out.liveIntroSeen ||= s.liveIntroSeen === true;
    const c = (s.checklist ?? {}) as Partial<Record<ChecklistStep, unknown>>;
    for (const k of CHECKLIST_STEPS) out.checklist[k] ||= c[k] === true;
  }
  return out;
}

interface State {
  /** Automatic onboarding is off (test bypass). Help and the tour can still be opened manually. */
  disabled: boolean;
  welcomeOpen: boolean;
  tour: { step: number } | null;
  helpOpen: boolean;
  liveSetupOpen: boolean;
  checklist: Record<ChecklistStep, boolean>;
  checklistDismissed: boolean;

  /** Progress has been loaded from preferences/localStorage (nothing auto-opens before this). */
  hydrated: boolean;
  version: number;
  welcomeDone: boolean;
  tourDone: boolean;
  liveIntroSeen: boolean;
  /** "Show me": the checklist step currently pointed at (non-blocking spotlight), if any. */
  pointer: ChecklistStep | null;
  /** The floating checklist card is expanded (desktop); by default it is a small pill. */
  checklistOpen: boolean;
  /** Which help section to scroll to when the help centre opens. */
  helpSection: string | null;
}

interface Actions {
  openWelcome(): void;
  closeWelcome(): void;
  startTour(): void;
  setTourStep(step: number): void;
  endTour(): void;
  openHelp(section?: string): void;
  closeHelp(): void;
  /** The only way UI should ask to switch to Live: opens the Live setup guide, which calls setMode('live') when done. */
  requestLiveMode(): void;
  closeLiveSetup(): void;
  /** Idempotent: marking a step that is already done does nothing. */
  markStep(step: ChecklistStep): void;
  dismissChecklist(): void;

  /** Load persisted progress (server preferences OR'd with the local mirror). */
  hydrate(remote: Partial<OnboardingPrefs> | null | undefined): void;
  showMe(step: ChecklistStep): void;
  clearPointer(): void;
  restoreChecklist(): void;
  setChecklistOpen(open: boolean): void;
  /** Acknowledge the current guide version without taking the tour. */
  acknowledgeVersion(): void;
  markLiveIntroSeen(): void;
  /** Start over: clears progress and shows the welcome again. */
  restart(): void;
}

export const useOnboarding = create<State & Actions>((set, get) => ({
  disabled: readDisabled(),
  welcomeOpen: false,
  tour: null,
  helpOpen: false,
  liveSetupOpen: false,
  checklist: { ...EMPTY_CHECKLIST },
  checklistDismissed: false,

  hydrated: false,
  version: 0,
  welcomeDone: false,
  tourDone: false,
  liveIntroSeen: false,
  pointer: null,
  checklistOpen: readOpen(),
  helpSection: null,

  openWelcome: () => set({ welcomeOpen: true, tour: null, pointer: null, helpOpen: false }),
  closeWelcome: () => set({ welcomeOpen: false, welcomeDone: true, version: Math.max(get().version, ONBOARDING_VERSION) }),
  startTour: () =>
    set({ tour: { step: 0 }, welcomeOpen: false, helpOpen: false, liveSetupOpen: false, pointer: null, welcomeDone: true, version: Math.max(get().version, ONBOARDING_VERSION) }),
  setTourStep: (step) => set({ tour: { step } }),
  endTour: () => {
    if (!get().tour) return;
    set({ tour: null, tourDone: true, version: Math.max(get().version, ONBOARDING_VERSION) });
  },
  // Callers may pass this straight to onClick, so ignore anything that isn't a section id.
  openHelp: (section) => set({ helpOpen: true, helpSection: typeof section === 'string' ? section : null, pointer: null, welcomeOpen: false }),
  closeHelp: () => set({ helpOpen: false, helpSection: null }),
  requestLiveMode: () => set({ liveSetupOpen: true, helpOpen: false, pointer: null }),
  closeLiveSetup: () => set({ liveSetupOpen: false }),
  markStep: (step) => {
    if (!CHECKLIST_STEPS.includes(step) || get().checklist[step]) return;
    set({ checklist: { ...get().checklist, [step]: true }, pointer: get().pointer === step ? null : get().pointer });
  },
  dismissChecklist: () => set({ checklistDismissed: true, pointer: null }),

  hydrate: (remote) => {
    const p = mergeProgress(remote, readLocal());
    const cur = get();
    // Anything marked before hydration (e.g. a step detected during boot) is kept.
    const checklist = { ...p.checklist };
    for (const k of CHECKLIST_STEPS) checklist[k] ||= cur.checklist[k];
    set({
      hydrated: true,
      version: p.version,
      welcomeDone: p.welcomeDone || cur.welcomeDone,
      tourDone: p.tourDone || cur.tourDone,
      checklist,
      checklistDismissed: p.checklistDismissed || cur.checklistDismissed,
      liveIntroSeen: p.liveIntroSeen || cur.liveIntroSeen,
    });
  },
  showMe: (step) => set({ pointer: step, helpOpen: false, tour: null, welcomeOpen: false }),
  clearPointer: () => set({ pointer: null }),
  restoreChecklist: () => set({ checklistDismissed: false, checklistOpen: true }),
  setChecklistOpen: (open) => {
    set({ checklistOpen: open });
    try {
      store()?.setItem(LS_OPEN, open ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  },
  acknowledgeVersion: () => set({ version: Math.max(get().version, ONBOARDING_VERSION) }),
  markLiveIntroSeen: () => {
    if (!get().liveIntroSeen) set({ liveIntroSeen: true });
  },
  restart: () =>
    set({
      version: 0,
      welcomeDone: false,
      tourDone: false,
      liveIntroSeen: false,
      checklist: { ...EMPTY_CHECKLIST },
      checklistDismissed: false,
      checklistOpen: false,
      helpOpen: false,
      tour: null,
      pointer: null,
      welcomeOpen: true,
    }),
}));

/** The persisted slice, in the shape stored in preferences. */
export function progressOf(s: Pick<State, 'version' | 'welcomeDone' | 'tourDone' | 'checklist' | 'checklistDismissed' | 'liveIntroSeen'>): OnboardingPrefs {
  return {
    version: s.version,
    welcomeDone: s.welcomeDone,
    tourDone: s.tourDone,
    checklist: { ...s.checklist },
    checklistDismissed: s.checklistDismissed,
    liveIntroSeen: s.liveIntroSeen,
  };
}

/**
 * Keep progress persisted: mirror to localStorage immediately and save to the server preferences
 * (debounced) through the caller-supplied saver. With the e2e bypass on, only the local mirror is
 * written. Returns an unsubscribe function.
 */
export function persistProgress(remote: Partial<OnboardingPrefs> | null, save: (p: OnboardingPrefs) => Promise<void>): () => void {
  // Start from what the server has, so progress that only reached the local mirror gets saved too.
  let last = JSON.stringify(mergeProgress(remote));
  let timer: number | null = null;
  const run = (s: State) => {
    if (!s.hydrated) return;
    const p = progressOf(s);
    const json = JSON.stringify(p);
    if (json === last) return;
    last = json;
    try {
      store()?.setItem(LS_STATE, json);
    } catch {
      /* storage unavailable */
    }
    if (s.disabled) return; // test bypass: never write the server copy
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      save(p).catch(() => undefined); // the local mirror already has it
    }, 400);
  };
  const unsub = useOnboarding.subscribe(run);
  run(useOnboarding.getState());
  return () => {
    unsub();
    if (timer) clearTimeout(timer);
  };
}

/** Read the (possibly absent, on an older server) onboarding slice from preferences. */
export function onboardingFromPrefs(prefs: Preferences | null | undefined): Partial<OnboardingPrefs> | null {
  const o = (prefs as Partial<Preferences> | null | undefined)?.onboarding;
  return o && typeof o === 'object' ? o : null;
}

// Dev/e2e handle, like window.__eko for the app store.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __ekoOnboarding: typeof useOnboarding }).__ekoOnboarding = useOnboarding;
