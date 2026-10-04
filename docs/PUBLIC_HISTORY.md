# About this public history

This public repository was reconstructed on October 2, 2026 from one current source snapshot.
It contains 371 nonempty component imports with author and committer dates distributed from
June 25 through October 2, 2026. June 25 is a representative late-June start date based on
the owner's reported development period. The source snapshot is recorded in `docs/EXPORT.md`.

These dates and commits are a publishing reconstruction. They are not original contemporaneous
commits, a time log, or evidence that an individual component existed on its displayed date.
Every commit carries a `Public-History: reconstructed from a current source snapshot` trailer.
This requirement applies to the initial 371 imports. Later genuine contributions keep their real
dates and truthful commit messages; the guard does not require them to claim a reconstructed origin.
Component groupings organize the finished source for reading; intermediate imports can reference
components introduced later. Run and evaluate the final tree.

Public author and committer fields use `EKO contributors <contributors@example.invalid>`.
No original private Git history is included. The original source checkout is preserved separately.

The portable guard scans every historical blob, filename and commit message, and requires neutral
author and committer fields. The identifier list is stored as length-indexed HMAC-SHA-256 fingerprints;
plaintext private identifiers are never committed. A random private key is kept in local Git metadata
and a repository Actions secret, so short identifiers cannot be enumerated from the public fingerprints.
The key is required; missing configuration fails closed, including fork workflows without repository secrets.
Synthetic negative tests exercise binary metadata,
case-insensitive substring matching, credentials, private paths, missing configuration and metadata.
Temporary-repository regressions check deleted historical content, reused blobs under forbidden paths
and symlinks. Local hooks compose with the existing identifier hooks, and CI checks the complete public history.

This protects the configured content and commit fields. It does not anonymize the GitHub account:
repository ownership, authenticated push activity, issue activity, workflow actors and other platform
records may identify the authenticated account. Unknown identifiers and secrets outside the configured
patterns still require care. GitHub Actions runs after publication and cannot prevent an initial upload.
For future contributions, extend the fingerprints privately before publishing new identity-bearing content.

## Updates after the reconstruction

From October 3, 2026, the public tree is updated by syncing it to a newer source revision. Each sync is a
genuine commit with its real date, a truthful message naming the source revision, and the neutral public
identity. Source revisions and their public commits are listed in `docs/EXPORT.md`. The original private
history is still not imported.

Maintainer prerequisite: `EKO_PUBLIC_GUARD_KEY` must hold the private 64-character hex key, or a local
checkout must have it in `.git/info/public-guard-key`. CI receives it from the `PUBLIC_GUARD_KEY`
repository Actions secret. Never put the key in the source tree, a commit, a log or a public message.
The local publication checkout is provisioned; ordinary public clones are not.
