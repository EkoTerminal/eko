"""Bounded, offline inventory of the two existing chain captures; no RPC or ingestion."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
reports = []
for relative in ["apps/indexer/test/fixtures/4663/blocks.json", "apps/indexer/test/fixtures/4663/live-compare/blocks.json"]:
    path = root / relative
    if path.stat().st_size > 16 * 1024 * 1024:
        raise ValueError("Capture exceeds 16 MiB")
    raw = path.read_bytes()
    data = json.loads(raw)
    records = list(data.get("blocks", data).values())
    if len(records) > 10000:
        raise ValueError("Capture exceeds 10,000 blocks")
    blocks = sorted({int(r["block"]["number"], 16) for r in records})
    event_keys, duplicates, removed, mismatched, receipts, logs = set(), 0, 0, 0, 0, 0
    for record in records:
        block = record["block"]
        receipts += len(record["receipts"])
        for receipt in record["receipts"]:
            mismatched += receipt["blockHash"].lower() != block["hash"].lower()
            for log in receipt["logs"]:
                logs += 1
                key = (log["transactionHash"].lower(), int(log["logIndex"], 16))
                duplicates += key in event_keys
                event_keys.add(key)
                removed += bool(log.get("removed", False))
                mismatched += log["blockHash"].lower() != block["hash"].lower()
    gaps = [{"from": str(a + 1), "to": str(b - 1)} for a, b in zip(blocks, blocks[1:]) if b > a + 1]
    reports.append({"file": relative, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw),
                    "blockCount": len(blocks), "from": str(blocks[0]), "to": str(blocks[-1]),
                    "missingBlockIntervals": gaps, "receiptCount": receipts, "logCount": logs,
                    "duplicateEventKeys": duplicates, "removedLogs": removed, "blockHashMismatches": mismatched})
output = {"version": 1, "origin": "existing-local-captures", "checkpoint": "086-local-capture-inventory-v1",
          "status": "unresolved", "liveApproved": False, "paidUnitsThisRun": 0, "costUsdThisRun": 0,
          "originalAcquisitionCostUsd": None,
          "limitations": "Selected captured blocks only; no lease, genesis, calendar-window, holder-baseline, Guard-review or live-head completeness evidence.",
          "captures": reports}
(root / "docs/operations/backfill-gate/086-local-capture-inventory.json").write_text(json.dumps(output, indent=2) + "\n")
print(json.dumps({"captures": len(reports), "blocks": sum(r["blockCount"] for r in reports), "status": "unresolved"}))
