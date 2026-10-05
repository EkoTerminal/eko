# Vulnerability reporting · draft

AI-assisted and automated review, not a professional audit.
This policy is prepared for each public repository. It is not effective until
reporting channels and scope identifiers are confirmed by the owner. Planned
activation: October 13, 2026, 13:00 UTC. There is no bug bounty: EKO does not
pay for reports (owner decision, 2026-10-05).

## Reporting

Role mailbox: `security@ekoterminal.com` (forwarding confirmed by the owner on 2026-10-04).
Private reporting: GitHub Security → Report a vulnerability in the affected
public repository (repository URL and enabled advisory channel pending).
Neither route has been verified by this preparation. Do not assume delivery
until the owner records a working route. Never post an exploit or private data
in public issues. Non-sensitive review questions can be public during the window.

Include affected artifact/commit, impact, minimal local or fork proof of concept
and reproduction steps. Do not include credentials, private keys, private journal
content or personal identifiers. The proposed acknowledgement target is 48 hours,
within the BACKEND §14.0 72-hour maximum; coordinate fixes and disclosure privately.

## Scope and exclusions

In scope when the corresponding deployment or surface is supplied and accepted:
ReceiptsRegistry on chain 4663; any guard bypass that lets a honeypot fill
(Critical); receipts verifier; SIWE; harness keys; MCP OAuth; EKO's Zodiac Roles
permission configuration. Registry addresses and accepted versions remain
unresolved; this policy does not imply deployment or execution availability.
The registry holds no user funds. Later EKO contracts require an explicit scope
update. On-chain guardrail enforcement remains unavailable until reviewed.

Excluded: third-party Pons, Uniswap, Safe and Zodiac contracts themselves,
brokerage systems, social engineering, denial of service, and systems outside
EKO's control. Review local copies, forks or accounts/data you control. No
production disruption, transfers of others' funds or unsolicited contact.

## Good-faith research commitment

For good-faith research following the effective policy, EKO will not pursue
legal action for the research or request a third party to do so. This commitment
covers systems EKO controls and cannot bind third parties. Stop and report if
another user's data appears. Avoid disruption, social engineering, extortion
and publication before coordinated disclosure. The disclosure coordinator
handles accidental policy ambiguity privately. This draft is pending approval.

## Review timing

Planned public review: October 13, 2026, 13:00 UTC → October 16, 2026, 13:00 UTC.
A High or Medium fix restarts all 72 hours. Fix rechecks and final hash: October
17; owner D0 sign-off: October 18, reconfirmation October 19. Window close does
not end reporting.
Deploying the receipts registry can precede review because it holds no funds;
it is not D0 acceptance. No open High/Medium or untriaged finding may pass the
BACKEND §14.0 gate. Critical findings also block sign-off.
