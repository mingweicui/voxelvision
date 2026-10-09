#!/usr/bin/env python3
"""Synchronize content-addressed shared assets and their page references."""

import argparse
import hashlib
from pathlib import Path
import re


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    changes = []
    for source in ("assets/site.css", "assets/site.js", "ct.js"):
        path = root / source
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()[:16]
        target = path.with_name(f"{path.stem}.{digest}{path.suffix}")
        if not target.exists() or target.read_bytes() != data:
            changes.append(str(target.relative_to(root)))
            if not args.check:
                target.write_bytes(data)
        stem = re.escape(str(path.relative_to(root).with_suffix("")))
        pattern = rf'(?<=")(?:\./)?{stem}(?:\.[0-9a-f]{{16}})?{re.escape(path.suffix)}(?:\?[^"\s]*)?(?=")'
        for page in root.glob("*.html"):
            text = page.read_text()
            updated = re.sub(pattern, str(target.relative_to(root)), text)
            if updated != text:
                changes.append(page.name)
                if not args.check:
                    page.write_text(updated)
    if args.check and changes:
        parser.exit(1, "Shared assets are stale; run python3 sync_assets.py: " + ", ".join(sorted(set(changes))) + "\n")
    print("Shared asset references verified." if args.check else "Shared asset references synchronized.")


if __name__ == "__main__":
    main()
