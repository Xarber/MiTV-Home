#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Use upstream-supported pure Python builds; reject accidental desktop binaries."""
import argparse
import base64
import csv
import io
import zipfile
import hashlib
import json
import os
from pathlib import Path
import subprocess

VERSIONS = {"aiohttp": "3.14.5", "zeroconf": "0.151.5", "yarl": "1.25.1",
            "multidict": "7.2.1", "frozenlist": "1.8.0", "propcache": "0.5.4"}

def portable_zeroconf(wheel):
    # Poetry marks any build-script wheel as platform-specific even when its
    # supported SKIP_CYTHON option produces no extension. Verify the actual files
    # before correcting metadata; never relabel a native library.
    target = wheel.with_name("zeroconf-0.151.5-py3-none-any.whl")
    with zipfile.ZipFile(wheel) as source:
        files = {name: source.read(name) for name in source.namelist() if not name.endswith("/")}
    for name, data in files.items():
        if name.endswith((".so", ".dll", ".dylib", ".a", ".lib", ".pyd")) or data.startswith(b"\x7fELF"):
            raise RuntimeError("Native binary found in purported pure zeroconf build")
    metadata = next(name for name in files if name.endswith(".dist-info/WHEEL"))
    record = next(name for name in files if name.endswith(".dist-info/RECORD"))
    files[metadata] = b"Wheel-Version: 1.0\nGenerator: MiTV-verified-pure\nRoot-Is-Purelib: true\nTag: py3-none-any\n"
    files.pop(record)
    rows = []
    for name, data in files.items():
        digest = base64.urlsafe_b64encode(hashlib.sha256(data).digest()).decode().rstrip("=")
        rows.append((name, "sha256=" + digest, str(len(data))))
    rows.append((record, "", ""))
    output = io.StringIO();csv.writer(output, lineterminator="\n").writerows(rows)
    files[record] = output.getvalue().encode()
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    wheel.unlink()


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
    for wheel in args.output.glob("zeroconf-*-linux_*.whl"):
        portable_zeroconf(wheel)
    from patch_pyatv import build
    build(args.output)
    records = []
    for wheel in args.output.glob("*.whl"):
        if not wheel.name.endswith("-none-any.whl"):
            raise RuntimeError(f"Unexpected native wheel in pure build: {wheel.name}")
        records.append({"file": wheel.name, "sha256": hashlib.sha256(wheel.read_bytes()).hexdigest()})
    args.output.joinpath("pure-provenance.json").write_text(json.dumps(records, indent=2) + "\n")

if __name__ == "__main__":
    main()
