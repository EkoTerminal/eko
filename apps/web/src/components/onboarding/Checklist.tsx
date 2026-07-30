import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/app';
import { CHECKLIST_STEPS, ONBOARDING_VERSION, REQUIRED_STEPS, useOnboarding } from '../../store/onboarding';
import { IconChevron, IconClose } from '../icons';
import { StatusDot } from './art';
import { CHECKLIST_COPY } from './steps';

function Ring({ done, total, size = 22 }: { done: number; total: number; size?: number }) {
  const r = size / 2 - 2.5;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ob-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} className="ob-ring-track" />
      <circle cx={size / 2} cy={size / 2} r={r} className="ob-ring-arc" strokeDasharray={c} strokeDashoffset={c * (1 - done / total)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

/** The five steps, with "Show me" for anything not yet done. Shared by the floating card and the help centre. */
export function ChecklistSteps({ onShow }: { onShow?: () => void }) {
  const checklist = useOnboarding((s) => s.checklist);
  const showMe = useOnboarding((s) => s.showMe);
  return (
    <ol className="ob-cl-list" aria-label="Getting started steps">
      {CHECKLIST_STEPS.map((step) => {
        const done = checklist[step];
        const copy = CHECKLIST_COPY[step];
        return (
          <li key={step} className={`ob-cl-item ${done ? 'is-done' : ''}`} data-testid={`checklist-${step}`} data-done={done ? 'true' : 'false'}>
            <StatusDot state={done ? 'ok' : 'todo'} />
            <span className="ob-cl-text">
              <strong>
                {copy.label}
                <span className="sr-only">{done ? ' — done' : ' — to do'}</span>
              </strong>
              <span className="ob-cl-hint">{copy.hint}</span>
            </span>
            {!done ? (
              <button
                className="btn sm ob-cl-show"
                onClick={() => {
                  onShow?.();
                  showMe(step);
                }}
                aria-label={`Show me: ${copy.label}`}
              >
                Show me
              </button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Toasts share the bottom-left corner: lift the checklist above whatever toasts are showing, so
 * neither covers the other.
 */
function useToastLift(): number {
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.toasts');
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      // Only when the toast stack actually sits on the left, over our corner.
      setH(r.height > 1 && r.left < 200 ? Math.ceil(r.height) + 10 : 0);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  return h;
}

export function useChecklistProgress() {
  const checklist = useOnboarding((s) => s.checklist);
  const done = REQUIRED_STEPS.filter((s) => checklist[s]).length;
  return { done, total: REQUIRED_STEPS.length, complete: done === REQUIRED_STEPS.length };
}

/** Floating "Getting started" card (desktop, bottom-left). Collapses to a pill; dismissible. */
export default function Checklist() {
  const open = useOnboarding((s) => s.checklistOpen);
  const setOpen = useOnboarding((s) => s.setChecklistOpen);
  const dismiss = useOnboarding((s) => s.dismissChecklist);
  const welcomeDone = useOnboarding((s) => s.welcomeDone);
  const version = useOnboarding((s) => s.version);
  const acknowledgeVersion = useOnboarding((s) => s.acknowledgeVersion);
  const startTour = useOnboarding((s) => s.startTour);
  const toast = useApp((s) => s.toast);
  const { done, total, complete } = useChecklistProgress();
  const lift = useToastLift();
  const liftStyle = { '--ob-lift': `${lift}px` } as React.CSSProperties;

  // A short celebration the moment the last required step lands (not on reload).
  const [celebrate, setCelebrate] = useState(false);
  const prev = useRef(complete);
  useEffect(() => {
    if (complete && !prev.current) {
      setCelebrate(true);
      setOpen(true);
      const t = window.setTimeout(() => setCelebrate(false), 2600);
      prev.current = complete;
      return () => clearTimeout(t);
    }
    prev.current = complete;
  }, [complete, setOpen]);

  // A little pulse on the pill whenever a step is ticked while collapsed.
  const [bump, setBump] = useState(0);
  const lastDone = useRef(done);
  useEffect(() => {
    if (done > lastDone.current) setBump((b) => b + 1);
    lastDone.current = done;
  }, [done]);

  const hide = () => {
    dismiss();
    toast({ kind: 'info', title: 'Checklist hidden', body: 'Bring it back any time from Help.' });
  };

  // The guide changed since this user last saw it: offer the new tour once.
  if (welcomeDone && version < ONBOARDING_VERSION)
    return (
      <aside className="ob-root ob-cl ob-cl--nudge" aria-label="Tour updated" style={liftStyle}>
        <div className="ob-cl-head">
          <strong>Trading is one tap now</strong>
        </div>
        <p className="ob-cl-sub">Take the 30-second tour to see how it works.</p>
        <div className="ob-cl-foot">
          <button className="btn ghost sm" onClick={acknowledgeVersion}>
            Not now
          </button>
          <button className="btn primary sm" onClick={startTour}>
            Take the tour
          </button>
        </div>
      </aside>
    );

  if (!open)
    return (
      <button
        key={bump}
        className={`ob-root ob-cl-pill ${bump ? 'is-bump' : ''} ${complete ? 'is-complete' : ''}`}
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label={`Getting started: ${done} of ${total} done. Show checklist`}
        data-testid="checklist-pill"
        style={liftStyle}
      >
        <Ring done={done} total={total} />
        <span>Getting started</span>
        <span className="num ob-cl-count">
          {done}/{total}
        </span>
        <IconChevron size={13} style={{ transform: 'rotate(180deg)' }} />
      </button>
    );

  return (
    <aside className={`ob-root ob-cl ${complete ? 'is-complete' : ''} ${celebrate ? 'is-celebrating' : ''}`} aria-label="Getting started" data-testid="checklist" style={liftStyle}>
      {celebrate ? (
        <span className="ob-burst" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </span>
      ) : null}
      <div className="ob-cl-head">
        <Ring done={done} total={total} size={26} />
        <div className="ob-cl-titles">
          <strong>{complete ? 'You’ve got the loop' : 'Getting started'}</strong>
          <span className="ob-cl-sub" aria-live="polite">
            {complete ? 'Ask, read, trade, close — on paper. Live is there when you want it.' : `${done} of ${total} done · on paper, no real money`}
          </span>
        </div>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Collapse checklist" aria-expanded data-tip="Collapse">
          <IconChevron size={14} />
        </button>
        <button className="icon-btn" onClick={hide} aria-label="Hide checklist" data-testid="checklist-dismiss">
          <IconClose size={13} />
        </button>
      </div>
      <ChecklistSteps />
    </aside>
  );
}
