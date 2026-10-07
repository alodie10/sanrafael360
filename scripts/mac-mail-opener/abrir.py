#!/usr/bin/env python3
import base64
import json
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

SCRIPT = r'''on run argv
  set theSubject to item 1 of argv
  set theTo to item 2 of argv
  set htmlText to read POSIX file (item 3 of argv) as «class utf8»
  tell application "Mail"
    set acc to first account
    set rawAddr to email addresses of acc
    if class of rawAddr is list then
      set addr to item 1 of rawAddr as text
    else
      set addr to rawAddr as text
    end if
    set theSender to (full name of acc) & " <" & addr & ">"
    set msg to make new outgoing message with properties {subject:theSubject, visible:true, html content:htmlText}
    tell msg
      set sender to theSender
      make new to recipient at end of to recipients with properties {address:theTo}
    end tell
    activate
  end tell
end run
'''


def payload(url: str) -> dict:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "sanrafael360-mail":
        raise SystemExit(1)
    raw = urllib.parse.parse_qs(parsed.query).get("p", [""])[0]
    data = json.loads(base64.b64decode(raw))
    to = str(data.get("to") or "").strip()
    subject = str(data.get("subject") or "").strip()
    html = str(data.get("html") or "")
    if "@" not in to or not subject or not html or len(html) > 500000:
        raise SystemExit(1)
    return {"to": to, "subject": subject, "html": html}


def main() -> None:
    data = payload(sys.argv[1])
    with tempfile.TemporaryDirectory(prefix="crm-mail-") as folder:
        script = Path(folder) / "abrir.applescript"
        cuerpo = Path(folder) / "cuerpo.html"
        script.write_text(SCRIPT, encoding="utf-8")
        cuerpo.write_text(data["html"], encoding="utf-8")
        subprocess.run(
            ["osascript", str(script), data["subject"], data["to"], str(cuerpo)],
            check=True,
        )


if __name__ == "__main__":
    main()
