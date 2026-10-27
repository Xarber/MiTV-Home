#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
set -euo pipefail
cd "$(dirname "$0")/.."
check_dir="$(mktemp -d)"
trap 'rm -rf "$check_dir"' EXIT
javac -d "$check_dir" app/src/main/java/it/xarber/tvhome/diagnostics/DeveloperSession.java app/src/main/java/it/xarber/tvhome/RemoteRequest.java tests/host/HostChecks.java app/src/main/java/it/xarber/tvhome/updates/UpdatePolicy.java tests/host/UpdatePolicyChecks.java
java -cp "$check_dir" it.xarber.tvhome.HostChecks
java -cp "$check_dir" it.xarber.tvhome.updates.UpdatePolicyChecks
python3 scripts/release.py check

python3 -m unittest discover -s tests/python -v
