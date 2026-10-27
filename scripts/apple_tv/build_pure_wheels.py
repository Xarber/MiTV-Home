#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Use upstream-supported pure Python builds; reject accidental desktop binaries."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

VERSIONS = {"aiohttp": "3.14.5", "zeroconf": "0.151.5", "yarl": "1.25.1",
            "multidict": "7.2.1", "frozenlist": "1.8.0", "propcache": "0.5.4"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, AIOHTTP_NO_EXTENSIONS="1", SKIP_CYTHON="1", YARL_NO_EXTENSIONS="1",
               MULTIDICT_NO_EXTENSIONS="1", FROZENLIST_NO_EXTENSIONS="1", PROPCACHE_NO_EXTENSIONS="1")
    for name, version in VERSIONS.items():
        subprocess.run(["python", "-m", "pip", "wheel", "--no-deps", "--no-binary", name,
                        "--wheel-dir", str(args.output), f"{name}=={version}"], env=env, check=True)
    records = []
    for wheel in args.output.glob("*.whl"):
        if not wheel.name.endswith("-none-any.whl"):
            raise RuntimeError(f"Unexpected native wheel in pure build: {wheel.name}")
        records.append({"file": wheel.name, "sha256": hashlib.sha256(wheel.read_bytes()).hexdigest()})
    args.output.joinpath("pure-provenance.json").write_text(json.dumps(records, indent=2) + "\n")

if __name__ == "__main__":
    main()
