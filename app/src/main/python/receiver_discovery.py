# SPDX-License-Identifier: AGPL-3.0-only
"""Reject our receivers without relying on friendly names or banning real models."""
from ipaddress import ip_address

# Shared public UxPlay constants, not a real device's private identity.
LEGACY_UXPLAY_PI = "2e388006-13ba-4041-9a67-25dd4a43d536"


def eligible_apple_tv(model, address, properties, excluded_addresses):
    try:
        remote = ip_address(str(address).split("%", 1)[0])
    except ValueError:
        return False
    for local in excluded_addresses:
        try:
            if remote == ip_address(str(local).split("%", 1)[0]):
                return False
        except ValueError:
            continue
    if properties.get("mitvhome") in ("receiver-v1", "preview-v1"):
        return False
    if properties.get("model") == "AppleTV3,2" and properties.get("pi", "").lower() == LEGACY_UXPLAY_PI:
        return False
    return "appletv" in str(model or "").replace(" ", "").lower()
