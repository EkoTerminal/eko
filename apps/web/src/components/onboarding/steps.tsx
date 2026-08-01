import type { ReactNode } from 'react';
import { PAPER_STARTING_CASH } from '@eko/shared';
import type { ChecklistStep, TourAnchor } from '../../store/onboarding';
import { useUi, type MobileSheet } from '../../store/ui';
import { Term } from './Term';

/** Phones: the chart, Markets or Positions fill the top; the Trade column is always docked below. */
export function openMobile(sheet: MobileSheet) {
  useUi.getState().set({ mobileSheet: sheet });
}

export interface TourStep {
  anchor: TourAnchor;
  title: string;
  body: ReactNode;
  /** Phone layout: what the top of the screen shows for this step. */
  mobileSheet: MobileSheet;
  /** Preferred side for the coach mark (desktop). */
  placement?: 'right' | 'left' | 'top' | 'bottom';
}

const cash = `$${PAPER_STARTING_CASH.toLocaleString('en-US')}`;

/** The guided tour: one idea per stop, in the order the Trade screen reads. */
export const TOUR_STEPS: TourStep[] = [
  {
    anchor: 'markets',
    title: 'Pick a market',
    body: 'Live prices. Tap a coin to chart it.',
    mobileSheet: 'markets',
    placement: 'right',
  },
  {
    anchor: 'chart',
    title: 'Read the chart',
    body: 'Candles show market activity. Review the observations and evidence before trading.',
    mobileSheet: 'none',
    placement: 'bottom',
  },
  {
    anchor: 'amount',
    title: 'Pick an amount',
    body: 'Buy and Sell trade this many dollars.',
    mobileSheet: 'none',
    placement: 'left',
  },
  {
    anchor: 'trade',
    title: 'One tap trades',
    body: 'Tap Buy or Sell to trade the amount above instantly. Paper fills at once; on Live your wallet asks you to sign.',
    mobileSheet: 'none',
    placement: 'left',
  },
  {
    anchor: 'positions',
    title: 'What you hold',
    body: 'Your positions and activity. Close sells all of a position in one tap.',
    mobileSheet: 'positions',
    placement: 'top',
  },
  {
    anchor: 'mode-switch',
    title: 'Paper first',
    body: (
      <>
        You start with {cash} of <Term id="paper">paper money</Term>. <Term id="live">Live</Term> uses your own wallet — switching walks you through it first.
      </>
    ),
    mobileSheet: 'none',
    placement: 'bottom',
  },
];

/** "Show me" targets for checklist steps. */
export const POINTERS: Record<ChecklistStep, { anchor: TourAnchor; title: string; body: string; mobileSheet: MobileSheet }> = {
  paper_trade: {
    anchor: 'trade',
    title: 'Make a paper trade',
    body: 'Pick an amount, then tap Buy. It fills at once — with paper money.',
    mobileSheet: 'none',
  },
  close_position: {
    anchor: 'positions',
    title: 'Close a position',
    body: 'Tap Close on a position to sell all of it at once.',
    mobileSheet: 'positions',
  },
  go_live: {
    anchor: 'mode-switch',
    title: 'Go live when you’re ready',
    body: 'Flip this to start the Live setup. It explains what changes and checks your wallet before anything is real.',
    mobileSheet: 'none',
  },
};

export const CHECKLIST_COPY: Record<ChecklistStep, { label: string; hint: string }> = {
  paper_trade: { label: 'Make your first paper trade', hint: 'Pick an amount, tap Buy' },
  close_position: { label: 'Close a position', hint: 'Close sells all of it' },
  go_live: { label: 'Go live when you’re ready', hint: 'Optional — your wallet, real funds' },
};

/** First visible element for an anchor (several can exist, e.g. desktop + menu copies). */
export function findAnchor(anchor: TourAnchor): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>(`[data-tour="${anchor}"]`)].find((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
    }) ?? null
  );
}
