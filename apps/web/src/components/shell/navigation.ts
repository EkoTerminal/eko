import type { Flags } from '@eko/shared';
import { resolveRoute } from '../../routes';
import { IconRadar, IconPairs, IconFeed, IconBag, IconEye, IconChart, IconAgent, IconApproval, IconPlug, IconLab, IconResearch, IconScore, IconCrew } from '../icons';
import { SHELL_COPY as C } from '../../copy/shell';

export const NAV_GROUPS = [
  ['Terminal', [['/radar', 'Radar'], ['/pairs', 'New pairs'], ['/feed', 'Feed'], ['/bags', 'Bags'], ['/watch', 'Watchlist'], ['/perps', 'Perps']]],
  ['Mission Control', [['/mission', 'Overview'], ['/mission/approvals', 'Approvals'], ['/mission/connect', 'Connect an agent'], ['/lab', 'Rule Lab'], ['/research', 'Research']]],
  ['Public record', [['/scoreboard', 'Scoreboard'], ['/census', 'Census']]],
] as const;
type NavPath = typeof NAV_GROUPS[number][1][number][0];
export const NAV_ICONS = {
  '/radar': IconRadar, '/pairs': IconPairs, '/feed': IconFeed, '/bags': IconBag,
  '/watch': IconEye, '/perps': IconChart, '/mission': IconAgent,
  '/mission/approvals': IconApproval, '/mission/connect': IconPlug,
  '/lab': IconLab, '/research': IconResearch, '/scoreboard': IconScore,
  '/census': IconCrew,
} satisfies Record<NavPath, typeof IconRadar>;
/** Desk trail: special detail ancestry, then exact nav match or longest prefix. */
export function breadcrumbTrail(path: string, flags: Partial<Flags> = {}): string[] {
  const route = resolveRoute(path, flags)?.route;
  if (!route) return [C.notFound];
  if (path.startsWith('/coin/')) return ['Terminal', 'Radar', 'Coin'];
  if (path.startsWith('/mission/agents/')) return ['Mission Control', 'Overview', 'Agent'];
  const items = NAV_GROUPS.flatMap(([group, entries]) => entries.map(([to, label]) => ({ group, to, label })))
    .filter((item) => resolveRoute(item.to, flags));
  const hit = items.find((item) => item.to === path)
    ?? items.filter((item) => path.startsWith(`${item.to}/`)).sort((a, b) => b.to.length - a.to.length)[0];
  return hit ? [hit.group, hit.label] : [route.workspace === 'mission' ? 'Mission Control' : route.workspace === 'trust' ? 'Public record' : 'Terminal', route.title];
}
