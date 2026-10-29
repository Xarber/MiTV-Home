#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
set -euo pipefail
cd "$(dirname "$0")/.."
check_dir="$(mktemp -d)"
trap 'rm -rf "$check_dir"' EXIT
javac -d "$check_dir" app/src/main/java/it/xarber/tvhome/diagnostics/DeveloperSession.java app/src/main/java/it/xarber/tvhome/RemoteRequest.java tests/host/HostChecks.java app/src/main/java/it/xarber/tvhome/updates/UpdatePolicy.java tests/host/UpdatePolicyChecks.java app/src/main/java/it/xarber/tvhome/playback/PairingAttempt.java tests/host/PairingAttemptChecks.java app/src/main/java/it/xarber/tvhome/playback/MusicActivityClock.java tests/host/MusicActivityChecks.java app/src/main/java/it/xarber/tvhome/RemoteKeys.java tests/host/RemoteKeysChecks.java
java -cp "$check_dir" it.xarber.tvhome.HostChecks
java -cp "$check_dir" it.xarber.tvhome.updates.UpdatePolicyChecks
java -cp "$check_dir" it.xarber.tvhome.playback.PairingAttemptChecks
java -cp "$check_dir" it.xarber.tvhome.playback.MusicActivityChecks
java -cp "$check_dir" it.xarber.tvhome.RemoteKeysChecks
python3 scripts/release.py check

python3 -m unittest discover -s tests/python -v
