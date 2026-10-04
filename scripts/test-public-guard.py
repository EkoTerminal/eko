#!/usr/bin/env python3
"""Synthetic negative tests never contain the owner's identifiers."""
import hashlib
import hmac
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import subprocess
import os

spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('public-guard.py'))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class PublicGuardTests(unittest.TestCase):
    def setUp(self):
        marker = b'demo-private-identity'
        key = b'synthetic-test-key'
        self.fingerprints = (key, {len(marker): {hmac.digest(key, marker, 'sha256').hex()}})

    def test_binary_and_mixed_case_embedded_identity_blocked(self):
        for data in (b'/home/DEMO-PRIVATE-IDENTITY/project', b'\x00GIF89a\x00demo-private-identity\x00', b'prefix-demo-private-identity@example.invalid'):
            with self.assertRaises(ValueError):
                guard.scan(data, self.fingerprints)

    def test_secret_material_blocked(self):
        for data in (b'-----BEGIN ' + b'PRIVATE KEY-----', b'ghp_' + b'x' * 36, b'AKIA' + b'A' * 16):
            with self.assertRaises(ValueError):
                guard.scan(data, self.fingerprints)

    def test_clean_placeholders_accepted(self):
        guard.scan(b'sample-user contributors@example.invalid API_KEY=replace-me', self.fingerprints)

    def test_private_paths_blocked(self):
        for path in (b'.env', b'apps/server/.env.local', b'docs/screenshots/capture.png', b'.claude/launch.json',
                     b'node_modules/module/index.js'):
            with self.assertRaises(ValueError):
                guard.check_path(path, self.fingerprints)
        for path in (b'.env.example', b'docs/tasks/report.md', b'docs/eko/FACTS.md',
                     b'harness-packs/generated/claude_code/.claude/skills/eko/SKILL.md'):
            guard.check_path(path, self.fingerprints)

    def test_empty_or_malformed_configuration_blocked(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'configuration.json'
            for value in ({'version':2,'algorithm':'hmac-sha256','fingerprints':[]}, {'version':2,'algorithm':'hmac-sha256','fingerprints':[{'length':3,'sha256':'invalid'}]}):
                path.write_text(json.dumps(value))
                with self.assertRaises(ValueError):
                    guard.configuration(path)

    def test_commit_identities_and_disclosure(self):
        valid = b'tree abc\nauthor ' + guard.IDENTITY + b' 1 +0000\ncommitter ' + guard.IDENTITY + b' 1 +0000\n\nAdd component\n\n' + guard.TRAILER + b'\n'
        guard.check_commit(valid, self.fingerprints)
        for invalid in (valid.replace(guard.IDENTITY, b'Demo contributor <demo@example.invalid>', 1), valid.replace(guard.TRAILER, b'')):
            with self.assertRaises(ValueError):
                guard.check_commit(invalid, self.fingerprints)


    def test_real_history_deleted_content_and_reused_blob_paths(self):
        original = guard.ROOT
        try:
            for scenario in ('deleted-identity', 'reused-blob-private-path', 'symlink'):
                with tempfile.TemporaryDirectory() as tmp:
                    guard.ROOT = root = Path(tmp)
                    environment = {**os.environ, 'GIT_AUTHOR_NAME':'EKO contributors', 'GIT_AUTHOR_EMAIL':'contributors@example.invalid', 'GIT_COMMITTER_NAME':'EKO contributors', 'GIT_COMMITTER_EMAIL':'contributors@example.invalid'}
                    def command(*args):
                        subprocess.run(['git',*args],cwd=root,env=environment,check=True,capture_output=True)
                    command('init','-q')
                    marker=b'demo-private-identity'
                    key=bytes.fromhex('ab'*32)
                    (root/'scripts').mkdir()
                    (root/'.git/info/public-guard-key').write_text(key.hex())
                    (root/'scripts/public-identity.json').write_text(json.dumps({'version':2,'algorithm':'hmac-sha256','fingerprints':[{'length':len(marker),'sha256':hmac.digest(key,marker,'sha256').hex()}]}))
                    (root/'component.txt').write_bytes(marker if scenario=='deleted-identity' else b'neutral component')
                    command('add','.')
                    command('commit','-q','-m','Import component\n\n'+guard.TRAILER.decode())
                    if scenario == 'deleted-identity':
                        (root/'component.txt').unlink()
                    elif scenario == 'reused-blob-private-path':
                        command('mv','component.txt','.env')
                    else:
                        (root/'linked.txt').symlink_to('component.txt')
                    command('add','-A')
                    command('commit','-q','-m','Update component\n\n'+guard.TRAILER.decode())
                    with self.assertRaises(ValueError, msg=scenario):
                        guard.run('history')
        finally:
            guard.ROOT = original


if __name__ == '__main__':
    unittest.main()
