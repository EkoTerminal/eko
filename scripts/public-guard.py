#!/usr/bin/env python3
"""Fail closed on private identifiers, secret material and public commit metadata."""
import argparse
import hashlib
import hmac
import json
from pathlib import Path
import re
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
IDENTITY = b'EKO contributors <contributors@example.invalid>'
TRAILER = b'Public-History: reconstructed from a current source snapshot'
SECRETS = (
    rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    rb'\bAKIA[A-Z0-9]{16}\b',
    rb'\bgh[pousr]_[A-Za-z0-9]{36,}\b',
    rb'\bgithub_pat_[A-Za-z0-9_]{40,}\b',
    rb'\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b',
)


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def configuration(path=None):
    value = json.loads((path or ROOT / 'scripts/public-identity.json').read_text())
    fingerprints = value.get('fingerprints')
    if value.get('version') != 2 or value.get('algorithm') != 'hmac-sha256' or not isinstance(fingerprints, list) or not fingerprints:
        raise ValueError('Identity fingerprint configuration must be nonempty')
    result = {}
    for item in fingerprints:
        length, digest = item.get('length'), item.get('sha256')
        if not isinstance(length, int) or length < 3 or not re.fullmatch('[0-9a-f]{64}', digest or ''):
            raise ValueError('Invalid identity fingerprint configuration')
        result.setdefault(length, set()).add(digest)
    key = os.environ.get('EKO_PUBLIC_GUARD_KEY', '')
    local_key = ROOT / '.git/info/public-guard-key'
    if not key and local_key.is_file():
        key = local_key.read_text().strip()
    if not re.fullmatch('[0-9a-f]{64}', key):
        raise ValueError('Private HMAC guard key is required; refusing an unverified publication')
    return bytes.fromhex(key), result


def scan(data, fingerprints):
    key, fingerprints = fingerprints
    if any(re.search(pattern, data) for pattern in SECRETS):
        raise ValueError('Secret-like material detected; public export blocked')
    # Scan raw bytes, including binary metadata, with case-insensitive ASCII matching.
    # A fingerprint stores no plaintext identifier. Substrings catch email and path embeddings.
    for token in re.findall(rb'\S+', data.lower()):
        for length, digests in fingerprints.items():
            for offset in range(len(token) - length + 1):
                if hmac.digest(key, token[offset:offset + length], 'sha256').hex() in digests:
                    raise ValueError('Private identity detected; public export blocked')


def check_path(path, fingerprints):
    scan(path, fingerprints)
    decoded = path.decode('utf8', errors='strict')
    # Root .claude/ is local editor tooling; generated harness packs ship a .claude/ tree for users.
    if any(part in decoded.split('/') for part in ('.git', 'node_modules', '.data')) or decoded.startswith('.claude/'):
        raise ValueError('Private/generated path is forbidden')
    # The spec (docs/eko) and task reports (docs/tasks) are public since the October 3 sync;
    # internal captures stay out because images cannot be reviewed for identifiers as text.
    if decoded.startswith('docs/screenshots/'):
        raise ValueError('Internal artifact is forbidden')
    if any(part.startswith('.env') and part != '.env.example' for part in decoded.split('/')):
        raise ValueError('Environment-secret file is forbidden')


def check_commit(raw, fingerprints, require_reconstructed=True):
    scan(raw, fingerprints)
    header, message = raw.split(b'\n\n', 1)
    for role in (b'author', b'committer'):
        rows = [line for line in header.splitlines() if line.startswith(role + b' ')]
        if len(rows) != 1 or not rows[0].startswith(role + b' ' + IDENTITY + b' '):
            raise ValueError('Public commits must use the neutral contributor identity')
    if require_reconstructed and TRAILER not in message.splitlines():
        raise ValueError('Public commit lacks reconstructed-history disclosure')


def run(mode):
    fingerprints = configuration()
    blobs = set()
    if mode == 'staged':
        for row in git('ls-files', '--stage', '-z').split(b'\0'):
            if not row:
                continue
            metadata, path = row.split(b'\t', 1)
            filemode, oid, stage = metadata.split()
            check_path(path, fingerprints)
            if filemode == b'120000' or stage != b'0':
                raise ValueError('Symlinks and unresolved index entries are forbidden')
        for path in git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').split(b'\0'):
            if path:
                check_path(path, fingerprints)
                scan(git('show', ':' + path.decode()), fingerprints)
        for role in ('GIT_AUTHOR_IDENT', 'GIT_COMMITTER_IDENT'):
            ident = git('var', role)
            if not ident.startswith(IDENTITY + b' '):
                raise ValueError('Commit identity must be neutral')
        print('Public guard: staged content and identities passed')
        return
    revisions = git('rev-list', '--all').splitlines()
    if not revisions:
        raise ValueError('Public history is empty')
    # The 371 reconstructed imports come first; later genuine commits keep their real messages
    # and dates (docs/PUBLIC_HISTORY.md), so a release needs at least the reconstructed set.
    if mode == 'release' and len(revisions) < 371:
        raise ValueError('Release requires the 371 disclosed, nonempty reconstructed commits')
    trees = set()
    reconstructed = set(git('rev-list', '--reverse', '--first-parent', 'HEAD').splitlines()[:371])
    for revision in revisions:
        check_commit(git('cat-file', 'commit', revision.decode()), fingerprints, revision in reconstructed)
        if not git('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', revision.decode()).strip():
            raise ValueError('Empty reconstructed commit is forbidden')
        trees.add(git('rev-parse', revision.decode() + '^{tree}').strip())
    # Every tree path is inspected even when Git reuses a blob under a different name.
    checked_paths = set()
    for tree in trees:
        for row in git('ls-tree', '-r', '-z', tree.decode()).split(b'\0'):
            if not row:
                continue
            metadata, path = row.split(b'\t', 1)
            filemode, kind, oid = metadata.split()
            if path not in checked_paths:
                check_path(path, fingerprints)
                checked_paths.add(path)
            if filemode not in (b'100644', b'100755') or kind != b'blob':
                raise ValueError('Symlinks, gitlinks and non-file entries are forbidden')
            blobs.add(oid)
    process = subprocess.Popen(['git','cat-file','--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    try:
        for oid in sorted(blobs):
            process.stdin.write(oid + b'\n')
            process.stdin.flush()
            info = process.stdout.readline().split()
            if len(info) != 3 or info[1] != b'blob':
                raise ValueError('Cannot read public history blob')
            data = process.stdout.read(int(info[2]))
            process.stdout.read(1)
            scan(data, fingerprints)
    finally:
        process.stdin.close()
        process.stdout.close()
        process.wait()
    print(f'Public guard: {len(revisions)} commit identities/messages and {len(blobs)} complete historical blobs passed')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=('staged','history','release'), default='history')
    args = parser.parse_args()
    try:
        run(args.mode)
    except (ValueError, OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        reason = str(error) if isinstance(error, ValueError) and not isinstance(error, json.JSONDecodeError) else 'Cannot verify public data or required configuration'
        print(f'Public guard blocked: {reason}', file=sys.stderr)
        sys.exit(1)
