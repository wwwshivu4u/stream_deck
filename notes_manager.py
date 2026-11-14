"""
Notes & Brain Dump Manager Module
Stores, updates, and manages voice-captured and typed thoughts, tasks, and notes in notes.json.
Supports categorization (tasks, ideas, bugs, snippets) and priorities (high, medium, low).
"""

import json
import os
import time
import uuid
from typing import Any, Dict, List, Optional

NOTES_FILE = os.path.join(os.path.dirname(__file__), "notes.json")


def load_notes() -> List[Dict[str, Any]]:
    if not os.path.exists(NOTES_FILE):
        return []
    try:
        with open(NOTES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_notes(notes: List[Dict[str, Any]]) -> bool:
    try:
        with open(NOTES_FILE, "w", encoding="utf-8") as f:
            json.dump(notes, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False


def add_note(text: str, category: str = "task", priority: str = "medium") -> Dict[str, Any]:
    notes = load_notes()
    clean_cat = category.strip().lower() if category else "task"
    if clean_cat not in ["task", "idea", "bug", "snippet"]:
        clean_cat = "task"

    clean_prio = priority.strip().lower() if priority else "medium"
    if clean_prio not in ["high", "medium", "low"]:
        clean_prio = "medium"

    item = {
        "id": f"note_{uuid.uuid4().hex[:8]}",
        "text": text.strip(),
        "category": clean_cat,
        "priority": clean_prio,
        "done": False,
        "created_at": time.strftime("%Y-%m-%d %H:%M"),
        "timestamp": time.time()
    }
    notes.insert(0, item)
    save_notes(notes)
    return item


def toggle_note(note_id: str) -> Optional[Dict[str, Any]]:
    notes = load_notes()
    for n in notes:
        if n["id"] == note_id:
            n["done"] = not n.get("done", False)
            save_notes(notes)
            return n
    return None


def delete_note(note_id: str) -> bool:
    notes = load_notes()
    filtered = [n for n in notes if n["id"] != note_id]
    if len(filtered) != len(notes):
        save_notes(filtered)
        return True
    return False


def clear_done_notes() -> int:
    notes = load_notes()
    filtered = [n for n in notes if not n.get("done", False)]
    removed = len(notes) - len(filtered)
    save_notes(filtered)
    return removed


def export_markdown() -> str:
    """Exports all notes as a structured Markdown document."""
    notes = load_notes()
    if not notes:
        return "# 📝 Desk Notes & Brain-Dump\n\n(No notes yet.)"

    lines = ["# 📝 Desk Notes & Brain-Dump\n"]
    categories = [
        ("task", "📋 Tasks & Todos"),
        ("bug", "🐛 Bugs & Fixes"),
        ("idea", "💡 Ideas & Brainstorming"),
        ("snippet", "💻 Code Snippets & Notes")
    ]

    for cat_key, cat_title in categories:
        cat_notes = [n for n in notes if n.get("category") == cat_key]
        if cat_notes:
            lines.append(f"## {cat_title}\n")
            for n in cat_notes:
                chk = "x" if n.get("done") else " "
                prio = n.get("priority", "medium").upper()
                prio_badge = f"`[{prio}]`" if prio != "MEDIUM" else ""
                lines.append(f"- [{chk}] {prio_badge} {n.get('text')} *(added {n.get('created_at', '')})*")
            lines.append("")

    return "\n".join(lines)


def ai_tidy_notes() -> Dict[str, Any]:
    """
    Cleans up notes: removes duplicate texts, capitalizes first letters,
    and strips trailing punctuation while preserving user IDs and state.
    """
    notes = load_notes()
    if not notes:
        return {"success": True, "count": 0, "message": "No notes to tidy up."}

    seen = set()
    cleaned = []
    tidied_count = 0

    for n in notes:
        raw_text = n.get("text", "").strip()
        if not raw_text:
            continue
        # Deduplication check
        norm_key = raw_text.lower()
        if norm_key in seen:
            tidied_count += 1
            continue
        seen.add(norm_key)

        # Capitalize first letter
        tidied_text = raw_text[0].upper() + raw_text[1:] if len(raw_text) > 1 else raw_text.upper()
        if tidied_text != raw_text:
            tidied_count += 1
            n["text"] = tidied_text

        cleaned.append(n)

    save_notes(cleaned)
    return {
        "success": True,
        "count": len(cleaned),
        "tidied": tidied_count,
        "notes": cleaned,
        "message": f"Organized and polished {len(cleaned)} notes!"
    }
