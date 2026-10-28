# SPDX-License-Identifier: AGPL-3.0-only
"""Allowlisted failure metadata. Never serialize exception messages or payloads."""
import asyncio

OPERATIONS={"scan","pair_begin","pair_finish","connect","state","command","disconnect","cancel_pairing","shutdown"}

def classify_failure(operation,error):
    result={"error":"connection_failed","stage":operation if operation in OPERATIONS else "unknown"}
    seen=set();current=error;chain=[]
    while current is not None and id(current) not in seen and len(chain)<8:
        seen.add(id(current));chain.append(current)
        current=current.__cause__ or current.__context__
    for item in chain:
        try:status=getattr(item,"status_code",None)
        except Exception:status=None
        if type(status) is int and 100<=status<=599:
            result.update(error="authorization_rejected" if status==470 else "http_error",http_status=status)
            return result
    if any(isinstance(item,(TimeoutError,asyncio.TimeoutError)) for item in chain):result["error"]="timeout"
    elif any(type(item).__name__ in {"AuthenticationError","InvalidCredentialsError","InvalidSignature","InvalidTag"} for item in chain):result["error"]="authentication_failed"
    elif any(type(item).__name__=="BackOffError" for item in chain):result["error"]="receiver_backoff"
    elif any(isinstance(item,OSError) for item in chain):result["error"]="network_error"
    return result
