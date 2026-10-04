# Audit fix 05: supply-chain pins, install controls, image digests, advisory record

Source: `.audit-grade/REPORT.md` (rescore 7.8 at 1ee237b), Path to 9 items "Pin seven scoped viem declarations",
"Add a second effective install control", "Establish production library/runtime/service advisory clearance", and the
Dockerfile/image part of "Complete deterministic build/deploy pins". Rubric lines this must earn (category E):
- 1.5 Security-critical libs pinned exactly (viem/ethers/wagmi, OpenZeppelin, wallet kits…) in in-scope packages.
- 1.5 Install-time controls: install scripts allow-listed (already: `allowBuilds` in pnpm-workspace.yaml) **plus** a
  release cooldown (`minimumReleaseAge`) or a malware scanner; any two of three for full points.
- 2.5 No known High/Critical advisories reachable from production code (npm audit / osv-scanner), with a record.
- 1.0 Toolchains, runtimes and services not on an advisory list; images pinned.

## Do
1. **viem exact pins.** Every in-scope workspace (apps/server, apps/engines, apps/indexer, apps/mcp, packages/chain,
   packages/db, packages/policy, packages/playbooks, packages/shared, packages/signal, packages/untrusted, contracts)
   that declares `viem` (or another security-critical chain/crypto lib: ethers, wagmi, @openzeppelin/*, siwe, jose) gets
   the **exact version already in pnpm-lock.yaml** (no `^`/`~`). Do not change resolved versions. Update the lockfile
   offline per AGENTS.md rule 6 and prove `pnpm install --frozen-lockfile --offline` succeeds. UI (apps/web) is out of
   audit scope: leave it unless sharing a catalog forces it; say what you did.
2. **Second install control.** Add `minimumReleaseAge: 4320` (3 days, minutes) to pnpm-workspace.yaml (pnpm 11
   setting), keeping `allowBuilds`. Prove frozen offline install still works and explain the effect in README's
   supply-chain/CI paragraph.
3. **Images by digest.** Pin, keeping a readable tag before the digest:
   - Dockerfile both stages: `node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`
   - infra/monitoring/compose.json:
     `prom/prometheus:v3.2.1@sha256:6927e0919a144aa7616fd0137d4816816d42f6b816de3af269ab065250859a62`,
     `prom/alertmanager:v0.28.1@sha256:27c475db5fb156cab31d5c18a4251ac7ed567746a2483ff264516437a39b15ba`,
     `grafana/grafana:11.6.16@sha256:d67af92050b8d93b393dc741864752a69c9da1ffa39c1bb9af49ad5d9e47d2c3` (11.6.0 → latest 11.6.x patch),
     `louislam/uptime-kuma:1.23.17@sha256:3d632903e6af34139a37f18055c4f1bfd9b7205ae1138f1e5e8940ddc1d176f9` (1.23.16 → 1.23.17).
   Update any docs that state the old tags. Add `docker` (directory `/`) and the monitoring compose path to
   `.github/dependabot.yml` only if Dependabot supports it for that file type; otherwise note it.
4. **Advisory record + CI gate.** `pnpm audit --prod` was run by the lead on 2026-10-02 at commit 2b1acbb: **0 advisories
   (info 0, low 0, moderate 0, high 0, critical 0)**. Record it in `docs/security/ADVISORIES.md` (date, commit, command,
   result, scope = production dependencies of in-scope packages; images and runtimes listed with versions/digests; Node 22
   and pnpm 11.5.1 not on the kit's advisory list: Bun ≤1.1.39, Anchor 1.0.0-rc.1, RISC Zero 2.0.0–2.0.2, affected SP1,
   vulnerable Redis images — none used). Add a step to the `node` job in `.github/workflows/ci.yml` after install:
   `pnpm audit --prod --audit-level high` (network is available in CI). Keep every existing hardening rule (SHA pins,
   permissions, no event interpolation).

## Proof
- `grep` showing no range specifiers left for the listed libs in in-scope manifests; frozen offline install passes.
- Dockerfile/compose show tag@digest everywhere; YAML/JSON parse.
- `pnpm typecheck` and `pnpm test` pass.

Follow AGENTS.md. Only this task. End with the AGENTS.md report.
