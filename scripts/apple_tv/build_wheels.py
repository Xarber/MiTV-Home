#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-only
"""Build the native pyatv dependencies on an existing Linux Actions runner."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

CHAQUOPY_COMMIT = "6e365e30f7199468d9fffe628fe9f0a7658fdbb3"
TARGET = "3.11.17-0"
VERSIONS = {"cffi": "2.0.0", "cryptography": "50.0.2", "pydantic_core": "2.50.1"}

def run(*args, cwd=None):
    subprocess.run(args, cwd=cwd, check=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--abi", choices=["armeabi-v7a", "arm64-v8a", "x86", "x86_64"], required=True)
    parser.add_argument("--work", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = args.work.resolve() / "chaquopy"
    args.output = args.output.resolve()
    run("git", "clone", "--filter=blob:none", "--no-checkout", "https://github.com/chaquo/chaquopy.git", str(root))
    run("git", "checkout", CHAQUOPY_COMMIT, cwd=root)
    run("bash", "target/download-target.sh", f"maven/com/chaquo/python/target/{TARGET}", cwd=root)
    pypi = root / "server/pypi"
    run("python", "-m", "pip", "install", "-r", str(pypi / "requirements.txt"))
    ffi = pypi / "dist/chaquopy-libffi"
    ffi.mkdir(parents=True)
    platform = {"arm64-v8a": ("21", "arm64_v8a"), "armeabi-v7a": ("16", "armeabi_v7a"), "x86": ("16", "x86"), "x86_64": ("21", "x86_64")}[args.abi]
    name = f"chaquopy_libffi-3.3-2-py3-none-android_{platform[0]}_{platform[1]}.whl"
    urllib.request.urlretrieve("https://chaquo.com/pypi-13.1/chaquopy-libffi/" + name, ffi / name)
    # CPython <=3.12 target archives have no sysconfig. Supply PyO3's documented
    # cross configuration for pydantic-core, which does not support the limited ABI.
    tool = pypi / "build-wheel.py"
    source = tool.read_text()
    anchor = '    @contextmanager\n    def env_vars(self):'
    addition = '''        if self.package == "pydantic_core":
            config = f"{self.build_dir}/pyo3-cross.txt"
            with open(config, "w") as out:
                out.write("implementation=CPython\\nversion=3.11\\nshared=true\\nabi3=false\\n"
                          f"lib_name=python3.11\\nlib_dir={self.host_env}/chaquopy/lib\\n"
                          f"pointer_width={32 if self.abi in ('armeabi-v7a', 'x86') else 64}\\n")
            env["PYO3_CONFIG_FILE"] = config

'''
    if source.count(anchor) != 1:
        raise RuntimeError("Pinned build tool no longer matches cross configuration hook")
    tool.write_text(source.replace(anchor, addition + anchor))
    for package, version in VERSIONS.items():
        recipe = args.work.resolve() / "recipes" / package
        recipe.mkdir(parents=True)
        requirements = "  build: [rust]\n" if package != "cffi" else ""
        requirements += "  host: [openssl]\n" if package == "cryptography" else "  host: [chaquopy-libffi 3.3]\n" if package == "cffi" else ""
        recipe.joinpath("meta.yaml").write_text(f'package:\n  name: {package}\n  version: "{version}"\nbuild:\n  number: 1\nrequirements:\n' + requirements)
        run("python", str(tool), "--python", "3.11", "--abi", args.abi, str(recipe), cwd=pypi)
    args.output.mkdir(parents=True, exist_ok=True)
    records = []
    for package in VERSIONS:
        wheels = list((pypi / "dist" / package.replace("_", "-")).glob("*.whl"))
        if not wheels:
            raise RuntimeError(f"No wheel built for {package}")
        for wheel in wheels:
            data = wheel.read_bytes()
            (args.output / wheel.name).write_bytes(data)
            records.append({"file": wheel.name, "sha256": hashlib.sha256(data).hexdigest()})
    args.output.joinpath("provenance.json").write_text(json.dumps({"chaquopy": CHAQUOPY_COMMIT, "target": TARGET, "abi": args.abi, "wheels": records}, indent=2) + "\n")

if __name__ == "__main__":
    main()
