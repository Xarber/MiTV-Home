#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Archive tracked repository and recursive pinned submodule sources only."""
from pathlib import Path
import subprocess
import sys
import io
import tarfile
root = Path(__file__).resolve().parents[1]
def tracked(directory):
    entries = subprocess.check_output(['git','ls-files','--stage','-z'],cwd=directory).split(b'\0')
    for entry in entries:
        if not entry: continue
        mode, object_id, rest = entry.split(b' ',2)
        stage, name = rest.split(b'\t',1)
        assert stage == b'0', 'Unresolved index'
        path = directory/name.decode()
        if mode == b'160000':
            assert (path/'.git').exists(), f'Uninitialized source: {path}'
            actual = subprocess.check_output(['git','rev-parse','HEAD'],cwd=path).strip()
            assert actual == object_id, f'Unexpected submodule revision: {path}'
            yield from tracked(path)
        else:
            assert path.exists() or path.is_symlink(), f'Missing source: {path}'
            yield path
with tarfile.open(sys.argv[1], 'w:gz', format=tarfile.PAX_FORMAT) as archive:
    commit = subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    epoch = subprocess.check_output(['git','show','-s','--format=%ct','HEAD'],cwd=root,text=True).strip()
    channel = subprocess.check_output(['git','branch','--show-current'],cwd=root,text=True).strip()
    provenance = f"commit={commit}\nchannel={channel}\nepoch={epoch}\n".encode()
    info = tarfile.TarInfo('MiTV-Home/source-build.properties'); info.size=len(provenance); info.mtime=int(epoch)
    archive.addfile(info,io.BytesIO(provenance))
    for path in tracked(root):
        archive.add(path, arcname='MiTV-Home/'+str(path.relative_to(root)), recursive=False)
print('Archived all tracked sources and pinned submodules')
