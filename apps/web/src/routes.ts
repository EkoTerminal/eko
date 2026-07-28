import { createElement, type ComponentType } from 'react';
import type { FlagName, Flags } from '@eko/shared';
import { match } from './lib/router';
import { PAGE_TITLES } from './copy/shell';
export type Stage = 'T' | 'D0' | 'D0+1' | `Drop ${1|2|3|4|5|6|7|8|9}`;
export interface RouteDef {
  path: string; stage: Stage; flag?: FlagName; auth: 'public' | 'siwe';
  workspace: 'terminal' | 'mission' | 'trust' | 'static'; title: string;
  load: () => Promise<{ default: ComponentType<{ params: Record<string, string> }> }>;
}
function route(path: string, stage: Stage, workspace: RouteDef['workspace'], auth: RouteDef['auth'] = 'public', flag?: FlagName): RouteDef {
  const title = PAGE_TITLES[path];
  return { path, stage, workspace, auth, flag, title, load: async () => {
    if (path === '/legal/:doc') return import('./pages/Legal');
    if (path === '/drops') return import('./pages/Drops');
    if (path === '/coin/:address') return import('./pages/terminal/Coin');
    if (path === '/radar') return import('./pages/terminal/Radar');
    if (path === '/pairs') return import('./pages/terminal/Pairs');
    if (path === '/feed') return import('./pages/terminal/Feed');
    if (path === '/research') return import('./pages/research/Research');
    if (path === '/mission') return import('./pages/mission/Agents');
    if (path === '/mission/agents/:id') return import('./pages/mission/AgentDetail');
    if (path === '/mission/connect') return import('./pages/mission/Connect');
    if (path === '/mission/approvals' || path === '/approve/:id') return import('./pages/mission/Approvals');
    const { default: Page } = await import('./pages/Placeholder');
    return { default: (props) => createElement(Page, { ...props, title }) };
  } };
}
export const ROUTES: readonly RouteDef[] = [
  route('/', 'T', 'static'),
  route('/radar', 'T', 'terminal'), route('/feed', 'T', 'terminal'), route('/pairs', 'T', 'terminal'),
  route('/coin/:address', 'T', 'terminal'), route('/scan/:id', 'T', 'terminal'),
  route('/bags', 'T', 'terminal', 'siwe'), route('/bags/r/:id', 'T', 'terminal'), route('/watch', 'T', 'terminal', 'siwe'),
  route('/scoreboard', 'T', 'trust'), route('/receipt/:id', 'T', 'trust'), route('/census', 'T', 'trust'), route('/drops', 'T', 'trust'),
  route('/mission', 'T', 'mission', 'siwe'), route('/mission/agents/:id', 'T', 'mission', 'siwe'), route('/mission/connect', 'T', 'mission', 'siwe'),
  route('/mission/approvals', 'D0', 'mission', 'siwe', 'approvals'), route('/approve/:id', 'D0', 'mission', 'siwe', 'approvals'),
  route('/lab', 'D0', 'mission', 'siwe', 'loop_lab'), route('/lab/:loopId', 'D0', 'mission', 'siwe', 'loop_lab'),
  route('/research', 'D0', 'mission', 'siwe', 'deep_research'), route('/research/:id', 'D0', 'mission', 'siwe', 'deep_research'), route('/perps', 'D0', 'terminal', 'public', 'perps_panel'),
  route('/burn', 'D0', 'trust', 'public', 'burn_board'), route('/swarm', 'D0', 'terminal', 'public', 'beat_the_swarm'),
  route('/embed/clear/:address', 'D0', 'static', 'public', 'clear_badge'),
  route('/settings', 'T', 'terminal'),
  // §3.20 clarifies §2.2: plan is dormant at T; tiers_active gates its controls, not its URL.
  route('/settings/plan', 'T', 'terminal'), route('/legal/:doc', 'T', 'static'),
  route('/afi', 'Drop 1', 'terminal', 'public', 'afi'), route('/embed/afi', 'Drop 1', 'static', 'public', 'afi'),
  route('/crews', 'Drop 2', 'terminal', 'public', 'rug_ring_radar'), route('/crews/:id', 'Drop 2', 'terminal', 'public', 'rug_ring_radar'),
  route('/leaderboards', 'Drop 2', 'trust', 'public', 'leaderboards'), route('/arena', 'Drop 3', 'terminal', 'public', 'arena'),
  route('/desk/:runId', 'Drop 4', 'terminal', 'public', 'desk_live'), route('/mission/launcher', 'Drop 5', 'mission', 'siwe', 'agent_launcher'),
  route('/inside', 'Drop 7', 'static', 'public', 'eko_inside'), route('/embed/verdict/:address', 'Drop 7', 'static', 'public', 'eko_inside'),
];
export function enabledRoutes(flags: Partial<Flags> = {}) { return ROUTES.filter((r) => !r.flag || flags[r.flag]); }
export function resolveRoute(path: string, flags: Partial<Flags> = {}) {
  for (const route of enabledRoutes(flags)) { const params = match(route.path, path); if (params) return { route, params }; }
  return null;
}
export function isCurrent(to: string, path: string) {
  if (to === '/radar') return path === to || path.startsWith('/coin/') || path.startsWith('/scan/');
  if (to === '/mission') return path === to || path.startsWith('/mission/agents/');
  return path === to || path.startsWith(`${to}/`);
}
