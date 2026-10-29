# SPDX-License-Identifier: AGPL-3.0-only
"""Bounded release-build diagnostics. Raw logs, packets and exception text never leave RAM."""
import asyncio
from collections import OrderedDict
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import re
import threading
import time

OPERATIONS={"scan","pair_begin","pair_finish","connect","state","command","disconnect","cancel_pairing","shutdown","system_prepare","system_connect","system_pair_begin","system_pair_finish","system_key","system_disconnect"}
ERRORS={"connection_failed","authorization_rejected","http_error","timeout","authentication_failed","receiver_backoff","network_error","invalid_pin","pairing_failed","device_unavailable","pairing_required","disconnected","unsupported","invalid_volume","storage_failed","runtime_unavailable","pairing_expired","pairing_canceled","busy"}
PATHS={"/pair-pin-start","/pair-setup","/pair-verify"}
IDENTIFIER=re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")


def exception_details(error):
    chain=[];seen=set();current=error
    while current is not None and id(current) not in seen and len(chain)<8:
        seen.add(id(current));name=type(current).__name__
        frames=[];tb=current.__traceback__;walked=0
        while tb is not None and walked<64:
            filename=Path(tb.tb_frame.f_code.co_filename).name
            function=tb.tb_frame.f_code.co_name
            if re.fullmatch(r"[A-Za-z0-9_.-]{1,80}",filename) and IDENTIFIER.fullmatch(function):
                frames.append({"file":filename,"function":function,"line":tb.tb_lineno});frames=frames[-8:]
            tb=tb.tb_next;walked+=1
        chain.append({"type":name if IDENTIFIER.fullmatch(name) else "UnknownError","frames":frames})
        current=current.__cause__ or current.__context__
    return chain


class Recorder:
    LIMIT=131072
    def __init__(self,directory,version,commit,sink=None,basename="paired-playback"):
        self.directory=Path(directory);self.directory.mkdir(parents=True,exist_ok=True)
        if basename not in {"paired-playback","system-remote"}:raise ValueError("Unknown diagnostic scope")
        self.path=self.directory/(basename+".jsonl");self.previous=self.directory/(basename+".previous.jsonl")
        self.version=version if re.fullmatch(r"\d+\.\d+\.\d+",version) else "unknown"
        self.commit=commit if re.fullmatch(r"[0-9a-f]{7,40}",commit) else "unknown"
        self.sink=sink;self.lock=threading.Lock()
    def write(self,kind,operation,**fields):
        if operation not in OPERATIONS or kind not in {"start","success","failure","http_request","http_response"}:return
        value={"utc":datetime.now(timezone.utc).isoformat(),"monotonic_ms":int(time.monotonic()*1000),"version":self.version,"commit":self.commit,"event":kind,"operation":operation}
        if fields.get("error") in ERRORS:value["error"]=fields["error"]
        for key in ["http_status","phase","elapsed_ms"]:
            number=fields.get(key)
            if type(number) is int and (100<=number<=599 if key=="http_status" else 0<=number<=6 if key=="phase" else 0<=number<=300000):value[key]=number
        host_type=fields.get("host_exception","")
        if isinstance(host_type,str) and IDENTIFIER.fullmatch(host_type):value["host_exception"]=host_type
        if fields.get("path") in PATHS:value["path"]=fields["path"]
        if fields.get("method") in {"GET","POST"}:value["method"]=fields["method"]
        # These entries are constructed only by exception_details, never from service payloads.
        if fields.get("exception") is not None:value["exceptions"]=exception_details(fields["exception"])
        line=json.dumps(value,separators=(",",":"),ensure_ascii=True)+"\n"
        try:
            with self.lock:
                if self.path.exists() and self.path.stat().st_size+len(line.encode())>self.LIMIT:self.path.replace(self.previous)
                with self.path.open("a",encoding="utf-8") as output:output.write(line)
            if self.sink:self.sink(line.rstrip())
        except Exception:pass  # Diagnostics never break pairing or log their own potentially private error.


class SafeHttpHandler(logging.Handler):
    def __init__(self,recorder):
        super().__init__();self.recorder=recorder;self.pending=OrderedDict()
    def emit(self,record):
        try:
            task=asyncio.current_task();key=id(task)
            if record.msg=="Sending %s message: %s" and isinstance(record.args,tuple) and len(record.args)==2:
                packet=record.args[1]
                if not isinstance(packet,bytes) or len(packet)>32768:return
                header,_,body=packet.partition(b"\r\n\r\n");first=header.split(b"\r\n",1)[0].split(b" ")
                if len(first)!=3 or first[0] not in {b"GET",b"POST"}:return
                path=first[1].decode("ascii",errors="strict")
                if path not in PATHS:return
                phase=None;i=0
                while i+2<=len(body):
                    tag,length=body[i],body[i+1];i+=2
                    if i+length>len(body):break
                    if tag==6 and length==1 and body[i]<=6:phase=body[i];break
                    i+=length
                fields={"path":path,"method":first[0].decode(),"phase":phase}
                operation="pair_finish" if path=="/pair-setup" and phase in (3,5) else "pair_begin" if path!="/pair-verify" else "connect"
                self.pending[key]=(operation,fields)
                if len(self.pending)>64:self.pending.popitem(last=False)
                self.recorder.write("http_request",operation,**fields)
            elif record.msg=="Got %s response: %s:" and isinstance(record.args,tuple) and len(record.args)==2:
                pending=self.pending.pop(key,None)
                if pending:
                    operation,fields=pending;self.recorder.write("http_response",operation,http_status=getattr(record.args[1],"code",None),**fields)
        except Exception:pass


def configure_http_logging(recorder):
    # An exact-template handler extracts only method/path/phase/status. It never
    # calls getMessage(), formats packet arguments or forwards other library logs.
    root=logging.getLogger();root.handlers=[logging.NullHandler()];root.setLevel(logging.CRITICAL)
    parent=logging.getLogger("pyatv");parent.handlers=[logging.NullHandler()];parent.setLevel(logging.CRITICAL);parent.propagate=False
    logger=logging.getLogger("pyatv.support.http");logger.handlers=[SafeHttpHandler(recorder)];logger.setLevel(logging.DEBUG);logger.propagate=False
    logging.disable(logging.NOTSET)
