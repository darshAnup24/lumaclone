#!/usr/bin/env python3
"""Initialize or inspect the orchestrator state without changing phase status."""
from pathlib import Path
import json
from datetime import datetime, timezone

SKILL_ROOT = Path(__file__).resolve().parents[1]
STATE = SKILL_ROOT / "implementation-state.json"

def now():
    return datetime.now(timezone.utc).isoformat()

def main():
    if STATE.exists():
        data = json.loads(STATE.read_text())
        print(json.dumps({
            "status": data.get("status"),
            "current_phase": data.get("current_phase"),
            "current_phase_name": data.get("current_phase_name"),
            "phase_status": data["phases"][data.get("current_phase", 0)]["status"]
        }, indent=2))
        return
    print("State file missing. Run the skill initialization procedure.")

if __name__ == "__main__":
    main()
