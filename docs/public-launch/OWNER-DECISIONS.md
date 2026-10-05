# Owner decisions for the launch pages

Updated 2026-10-05. Until each open item is decided, the pages say "pending owner confirmation",
"Not published yet" or "Draft — pending owner approval". Nothing open here has been decided for you.

## Decided by the owner on 2026-10-05

- **No token burns, buybacks or milestone buys.** EKO does not encourage holding its planned
  token for financial benefit. The burn wallet, the daily burn, the launch buy-and-burn, the
  Burn Board, Pons buybacks as EKO policy, milestone buys and the milestone timelock are
  dropped from every page.
- **No bug bounty.** Private reporting stays open (GitHub private vulnerability reporting on
  `EkoTerminal/eko` and the security.txt contact). No rewards, payment, funding or payouts.
- **Terms and Privacy approved** (item 9).
- **Policy and privacy questions** go to the official EKO X and Telegram accounts, as listed on
  `/official` (item 10).
- **No closed beta.** The product launches publicly on Tue Oct 13.

## Security reporting (`/security`)

1. **Rewards.** Decided 2026-10-05: no bug bounty, so no reward table.
2. **Payment.** Decided 2026-10-05: no bug bounty, so no payment.
3. **Funding.** Decided 2026-10-05: no bug bounty, so no launch float or payouts.
4. **Good-faith promise.** Confirm the promise not to take legal action against people who
   follow the policy in good faith.
5. **Start.** Decided 2026-10-05: there is no bounty to start; private reporting is open now.
   Still open: who reads the security mailbox and answers within 48 hours.
6. **Scope.** Confirm the scope for reports is the receipts registry contract plus the code in
   `EkoTerminal/eko`. GO-PLAN also lists the Zodiac Roles setup; it joins when it exists.

## Repositories

7. GO-PLAN §3.5 planned three separate public repositories (contracts, playbooks,
   receipts-verifier). Today the whole monorepo, `EkoTerminal/eko`, is public. Decide whether
   that repository is the public code for the review window, or whether you still
   want the three separate ones.

## Addresses and accounts (`/official`, `/transparency`)

8. Publish each of these when ready, with how it was checked: receipts registry contract,
   registry owner and committer, dev fee wallet, the official X, Telegram and Farcaster
   accounts, and the status page address. (The burn wallet and the milestone timelock were
   dropped on 2026-10-05.)

## Terms and privacy (`/legal/terms`, `/legal/privacy`)

9. **Approved 2026-10-05.** The owner approved Terms and Privacy on 2026-10-05; this file
   records the approval. Both pages now show version `2026-10-05` and the approval date, with
   no "Draft" label. The approved text drops the burn wallet and says only that any terminal
   fee from token day will be published before it starts.
10. **Decided 2026-10-05.** Policy and privacy questions go to the official EKO X and Telegram
    accounts, as listed on `/official`. Both accounts are still "Not published yet" there.
11. **Service providers.** Whether to name the hosting, database, blockchain data, AI and
    error-reporting providers in the privacy policy, and which ones. Until then the policy
    says the list will be published once confirmed.
12. **Retention.** How long server logs and backups are kept (the policy says these will be
    published once confirmed), and whether the planned periods
    (sessions 90 days, measurements 30 days, bot interactions 1 year, AI detail 180 days,
    audit logs 2 years) are what you want.
13. **Facts to confirm in production before launch:** "Delete my harness data" works
    (journal keys are configured) and sanctions screening is on.
14. **Telegram group bot.** The privacy policy does not describe it yet. GO-PLAN wants it to
    say group messages are checked for contract addresses only and not stored. Confirm the
    bot works that way before it goes live, then that sentence can be added.
15. **Legal terms.** The policies add no liability, warranty, governing-law or dispute terms.
    GO-PLAN plans a lawyer's review in month 4; decide whether you want one sooner.
16. The other five policies (risk, AI, team trading, KOL, sanctions) stay drafts, now
    `2026-10-05-draft.3`. Draft 3 only removes the burn wallet, the milestone timelock and the
    team-token timelock lock from the team trading policy; team token buys must still be
    disclosed. The team trading blackout length is still open.

## Release and upkeep

17. `security.txt` expires on 2027-10-01. Someone must renew it before then.
18. The pages are live on staging since 2026-10-05. Each keeps its "pending" label until its item is decided.
