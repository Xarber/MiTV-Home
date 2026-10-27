#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Rebuild pinned MIT pyatv with the narrow upstream tvOS 27 PIN-header fix."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import urllib.request

PATCH = Path(__file__).resolve().parent / "patches/pyatv-0.18.0-tvos27-client-name.patch"
UPSTREAM = "https://github.com/postlund/pyatv/pull/2894"

def build(output):
    output = output.resolve();output.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen("https://pypi.org/pypi/pyatv/0.18.0/json", timeout=30) as response:
        data = json.load(response)
    sources = [item for item in data["urls"] if item["packagetype"] == "sdist"]
    if len(sources) != 1:raise RuntimeError("Expected one pinned source archive")
    with urllib.request.urlopen(sources[0]["url"], timeout=30) as response:
        payload = response.read(8_000_001)
    digest = hashlib.sha256(payload).hexdigest()
    if len(payload)>8_000_000 or digest != sources[0]["digests"]["sha256"]:raise RuntimeError("Source checksum mismatch")
    with tempfile.TemporaryDirectory(prefix="mitv-pyatv-source-") as temporary:
        root = Path(temporary)
        with tarfile.open(fileobj=io.BytesIO(payload)) as archive:archive.extractall(root, filter="data")
        source = root / "pyatv-0.18.0"
        subprocess.run(["git", "apply", "--check", str(PATCH)], cwd=source, check=True)
        subprocess.run(["git", "apply", str(PATCH)], cwd=source, check=True)
        subprocess.run([sys.executable, "-m", "pip", "wheel", "--no-deps", "--wheel-dir", str(output), str(source)], check=True)
    wheel = output / "pyatv-0.18.0-py3-none-any.whl"
    if not wheel.is_file():raise RuntimeError("Expected pure Python patched wheel")
    (output / "pyatv-patch-provenance.json").write_text(json.dumps({"version":"0.18.0", "upstream":UPSTREAM,
        "upstreamCommit":"fa9ef01dce9928e6be959b7f9b67d14a0c722b06", "sourceSha256":digest,
        "patchSha256":hashlib.sha256(PATCH.read_bytes()).hexdigest(), "wheelSha256":hashlib.sha256(wheel.read_bytes()).hexdigest()}, indent=2)+"\n")

if __name__ == "__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",type=Path,required=True)
    build(parser.parse_args().output)
