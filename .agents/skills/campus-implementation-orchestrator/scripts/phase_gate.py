#!/usr/bin/env python3
"""Fail closed if the current phase is not marked passed."""
from pathlib import Path
import json
import sys

SKILL_ROOT = Path(__file__).resolve().parents[1]
STATE = SKILL_ROOT / "implementation-state.json"

data = json.loads(STATE.read_text())
phase = data["phases"][data["current_phase"]]
if phase["status"] != "passed":
    print(f"BLOCKED: phase {phase['id']} {phase['name']} is {phase['status']}")
    sys.exit(1)

print(f"PASS: phase {phase['id']} {phase['name']}")
