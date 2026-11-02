"""Renders voice lines with Kokoro (af_heart) on this machine, for scripts/voice/local.ts.

    pip install kokoro-onnx soundfile
    # model files from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
    KOKORO_DIR=/path/to/models python3 scripts/voice/kokoro.py todo.json wavs/

todo.json is [{"id": ..., "text": ...}]; each line becomes wavs/<id>.wav (24 kHz), and the list is copied next to them
so the finishing step knows each clip's text. Lines already rendered are skipped, so a run can be stopped and resumed.
"""

import json
import os
import shutil
import sys

import soundfile as sf
from kokoro_onnx import Kokoro


def main():
    todo_path, out = sys.argv[1], sys.argv[2]
    models = os.environ.get("KOKORO_DIR", ".")
    os.makedirs(out, exist_ok=True)
    shutil.copy(todo_path, os.path.join(out, "todo.json"))
    todo = json.load(open(todo_path))
    k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
    for i, c in enumerate(todo):
        path = os.path.join(out, c["id"] + ".wav")
        if os.path.exists(path):
            continue
        samples, rate = k.create(c["text"], voice="af_heart", speed=1.0, lang="en-us")
        sf.write(path, samples, rate)
        if (i + 1) % 25 == 0:
            print(f"{i + 1}/{len(todo)}", flush=True)
    print(f"rendered {len(todo)} lines into {out}")


if __name__ == "__main__":
    main()
