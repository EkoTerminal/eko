import { useEffect } from 'react';
import type { Order } from '@eko/shared';
import { api } from '../../lib/api';
import { useApp } from '../../store/app';
import { onboardingFromPrefs, persistProgress, useOnboarding } from '../../store/onboarding';

type AppState = ReturnType<typeof useApp.getState>;

/** Detect retained paper-trade, close-position and live-mode checklist steps. */
export function startDetection(): () => void {
  const checkedSells = new Set<string>();
  let closing = false;

  const verifyClose = async (sells: Order[]) => {
    if (closing) return;
    closing = true;
    try {
      const r = await api<{ positions: { market: string; quantity: number }[] }>('/api/portfolio?mode=paper');
      const open = new Map(r.positions.map((p) => [p.market, p.quantity]));
      if (sells.some((o) => (open.get(o.market) ?? 0) <= 1e-9)) useOnboarding.getState().markStep('close_position');
    } catch {
      // Can't verify right now; a later order update will try again.
      for (const o of sells) checkedSells.delete(o.id);
    } finally {
      closing = false;
    }
  };

  const check = (s: AppState, prev?: AppState) => {
    const ob = useOnboarding.getState();
    const { checklist, markStep } = ob;

    if (!checklist.go_live && s.mode === 'live') markStep('go_live');

    if (!prev || s.orders !== prev.orders) {
      const filled = s.orders.filter((o) => o.mode === 'paper' && o.status === 'filled');
      if (!checklist.paper_trade && filled.length) markStep('paper_trade');
      if (!useOnboarding.getState().checklist.close_position) {
        const sells = filled.filter((o) => o.side === 'sell' && !checkedSells.has(o.id));
        if (sells.length) {
          for (const o of sells) checkedSells.add(o.id);
          void verifyClose(sells);
        }
      }
    }

  };

  check(useApp.getState());
  return useApp.subscribe(check);
}

/** Hydrate progress from preferences (+ local mirror), keep it saved, and watch for checklist steps. */
export function useOnboardingSync() {
  useEffect(() => {
    const remote = onboardingFromPrefs(useApp.getState().preferences);
    useOnboarding.getState().hydrate(remote);
    const stopPersist = persistProgress(remote, (onboarding) => useApp.getState().setPreferences({ onboarding }));
    const stopDetect = startDetection();
    return () => {
      stopPersist();
      stopDetect();
    };
  }, []);
}
