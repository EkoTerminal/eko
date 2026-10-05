# Owner decisions still open for the launch pages

Updated 2026-10-05. Until each item is decided, the pages say "pending owner confirmation",
"Not published yet" or "Draft — pending owner approval". Nothing here has been decided for you.

## Bug bounty (`/security`)

1. **Rewards.** Keep or change the proposed table: Critical $500, High $300, Medium $150,
   Low $50, Info $0, at most $500 per valid bug.
2. **Payment.** Confirm: paid in USDC or ETH to a wallet the reporter chooses, no ID asked.
3. **Funding.** How much launch float to set aside for payouts before token day. After token
   day, payouts come from creator fees through the dev fee wallet (GO-PLAN §6.3).
4. **Good-faith promise.** Confirm the promise not to take legal action against people who
   follow the policy in good faith.
5. **Start.** Confirm the bounty starts October 13, 2026, 13:00 UTC, and who reads the
   security mailbox and answers within 48 hours.
6. **Scope.** Confirm the scope is the receipts registry contract plus the code in
   `EkoTerminal/eko`. GO-PLAN also lists the Zodiac Roles setup; it joins when it exists.

## Repositories

7. GO-PLAN §3.5 planned three separate public repositories (contracts, playbooks,
   receipts-verifier). Today the whole monorepo, `EkoTerminal/eko`, is public. Decide whether
   that repository is the public code for the review window and bounty, or whether you still
   want the three separate ones.

## Addresses and accounts (`/official`, `/transparency`)

8. Publish each of these when ready, with how it was checked: receipts registry contract,
   registry owner and committer, dev fee wallet, burn wallet, milestone timelock, the official
   X, Telegram and Farcaster accounts, and the status page address.

## Terms and privacy (`/legal/terms`, `/legal/privacy`)

9. **Read and approve** draft `2026-10-05-draft.2`, or send changes. When you approve, give
   the date and where the approval is recorded; the "Draft" label stays until then.
10. **Contact address** for policy and privacy questions (for example a role mailbox like
    the security one, with forwarding confirmed).
11. **Service providers.** Whether to name the hosting, database, blockchain data, AI and
    error-reporting providers in the privacy policy, and which ones.
12. **Retention.** How long server logs and backups are kept, and whether the planned periods
    (sessions 90 days, measurements 30 days, bot interactions 1 year, AI detail 180 days,
    audit logs 2 years) are what you want.
13. **Facts to confirm in production before approving:** "Delete my harness data" works
    (journal keys are configured) and sanctions screening is on.
14. **Telegram group bot.** The privacy draft does not describe it yet. GO-PLAN wants it to
    say group messages are checked for contract addresses only and not stored. Confirm the
    bot works that way before it goes live, then that sentence can be added.
15. **Legal terms.** The drafts add no liability, warranty, governing-law or dispute terms.
    GO-PLAN plans a lawyer's review in month 4; decide whether you want one sooner.
16. The other five policies (risk, AI, team trading, KOL, sanctions) are unchanged from
    draft 1. The team trading blackout length is still open.

## Release and upkeep

17. `security.txt` expires on 2027-10-01. Someone must renew it before then.
18. The pages are live on staging since 2026-10-05. Each keeps its "pending" label until its item is decided.
