#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Reject incomplete, altered or wrong-ABI reused native dependency artifacts."""
import argparse
import hashlib
import json
from pathlib import Path
from build_wheels import CHAQUOPY_COMMIT, TARGET, VERSIONS

parser = argparse.ArgumentParser()
parser.add_argument("--abi", required=True)
parser.add_argument("directory", type=Path)
args = parser.parse_args()
metadata = list(args.directory.glob("provenance*.json"))
assert len(metadata) == 1, "Exactly one native provenance record required"
value = json.loads(metadata[0].read_text())
assert value["chaquopy"] == CHAQUOPY_COMMIT and value["target"] == TARGET and value["abi"] == args.abi
names = set()
for record in value["wheels"]:
    name = record["file"]
    assert Path(name).name == name and name.endswith("_" + args.abi.replace("-", "_") + ".whl")
    package = next((key for key, version in VERSIONS.items() if name.startswith(key + "-" + version + "-")), None)
    assert package is not None and package not in names, "Unexpected or duplicate native package"
    names.add(package)
    assert hashlib.sha256((args.directory / name).read_bytes()).hexdigest() == record["sha256"]
assert names == set(VERSIONS), "Incomplete native dependency set"
assert len(list(args.directory.glob("*.whl"))) == len(names), "Unlisted wheel"
print("PASS: pinned Android dependency versions, ABI, provenance and hashes")
