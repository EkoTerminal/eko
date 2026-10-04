import type { ReactNode } from 'react';
import { BUILT_ON, DYOR, NON_AFFILIATION } from '../../copy';
import { Link } from '../../lib/Link';
import '../legal.css';

// TODO(spec): Accepted public repository URLs and project deployment records are
// not supplied. Keep identifiers unresolved until the owner supplies provenance.
const projects = ['ReceiptsRegistry', 'Registry owner', 'Registry committer', 'Dev fee wallet', 'Burn wallet', 'Milestone timelock'];
const repositories = ['contracts', 'playbooks', 'receipts-verifier'];
function Frame({ title, children }: { title: string; children: ReactNode }) {
  return <div className="shell-page legal-page">
    <header className="page-head"><span className="eyebrow">Public launch preparation</span><h1>{title}</h1></header>
    <nav className="policy-links" aria-label="Project evidence"><Link to="/official">Official project links</Link><Link to="/transparency">Transparency</Link><Link to="/scoreboard">Scoreboard</Link><Link to="/legal/terms">Launch policies</Link></nav>
    <aside className="legal-review"><h2>Prepared · release evidence pending</h2><p>We have no token yet at T; any token claiming to be EKO is fake. We never DM first. Public repository URLs and verified project identifiers have not been supplied for this candidate.</p></aside>
    <article>{children}</article>
    <footer className="legal-footer"><p>{BUILT_ON}</p><p>{NON_AFFILIATION}</p><p>{DYOR}</p></footer>
  </div>;
}
export function Official() {
  return <Frame title="Official project links">
    <section><h2>Project identifiers</h2><p>Public domain: {'{{PUBLIC_DOMAIN}}'} · Pending owner confirmation. No token contract is listed at T.</p><dl>{projects.map(role => <div key={role}><dt>{role}</dt><dd>Unresolved · verified public record pending</dd></div>)}</dl></section>
    <section><h2>Source repositories</h2><ul>{repositories.map(name => <li key={name}>{name} · Prepared files only; publication and URL pending</li>)}</ul></section>
    <section><h2>Disclosure channel</h2><p>Role mailbox: security@ekoterminal.com · Forwarding pending owner confirmation. Private repository advisories also await an enabled public repository. Do not assume either reporting route is available.</p><p>The bounty terms and security.txt are draft files. No live or funded bounty is established by this page.</p></section>
  </Frame>;
}
export function Transparency() {
  return <Frame title="Transparency">
    <section><h2>Review and deployment are separate</h2><p>AI-assisted and automated review, not a professional audit.</p><p>The receipts registry holds no user funds and may be deployed before its review is accepted. No verified deployment address, live bytecode comparison or completed review is supplied here. Browser receipt verification remains unavailable until an independently verified registry pin is supplied.</p><p>On-chain guardrails remain advisory until their permission configuration passes review. A passing fixture does not establish live acceptance.</p></section>
    <section><h2>Planned public review</h2><p>October 13, 2026, 13:00 UTC to October 16, 2026, 13:00 UTC. Opening and closing evidence are pending. A High or Medium fix restarts the full 72 hours.</p><p>Fix rechecks and final hash: October 17. Owner D0 sign-off: October 18, reconfirmed October 19. Planned token day: October 20, subject to acceptance.</p></section>
    <section><h2>Evidence and gaps</h2><p>The repository preparation includes file hashes, licences, privileged powers, invariants, negative tests, coverage, fork results, mutation results and the findings ledger. These retained reports refer to their own candidates; final-candidate reports and public URLs are pending.</p><p>Three contract findings remain open (two Low, one Info). Historical Medium findings are marked fixed in their ledger; final-candidate rechecks are pending. Reported aggregate core coverage is 92.04%, below the 95% target. Original fork-pin dependency evidence remains incomplete.</p><p>Three independent contract reviews, analyzer reports, completed public window, final hash and active bounty evidence remain required. No final sign-off is recorded.</p></section>
    <section><h2>Check project roles and history</h2><p>When accepted identifiers are supplied, check chain 4663, source commit, deployment transaction and exact runtime bytecode. Read the registry owner(), pendingOwner() and committer(); verify any multisig threshold and modules separately.</p><p>The dev fee wallet and burn wallet have separate roles. Creator fees fund proposed bounty rewards; terminal fees belong to the burn wallet. Daily manual buy-and-burn activity and the launch buy-and-burn are staged for token day. No burn transaction or wallet history is claimed here.</p></section>
  </Frame>;
}
