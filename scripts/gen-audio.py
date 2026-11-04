#!/usr/bin/env python3
"""Creates a recording for every Thai word that does not have one, and removes recordings no longer used.

Reads the list from stdin: [{"th": ..., "name": ...}]. A failure leaves the app working, because it then
falls back to the phone's Thai voice, so this exits cleanly and the next deploy tries the missing ones again.
"""
import asyncio
import json
import pathlib
import sys

import edge_tts

OUT = pathlib.Path("public/audio/th")
VOICE = "th-TH-NiwatNeural"
RATE = "-10%"


async def make(item, gate, failed):
    path = OUT / f"{item['name']}.mp3"
    async with gate:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(item["th"], VOICE, rate=RATE).save(str(path))
                if path.stat().st_size > 500:
                    return
            except Exception as err:  # the service is remote, so any error here is worth a retry
                print(f"retry {item['th']}: {err}", file=sys.stderr)
            path.unlink(missing_ok=True)
            await asyncio.sleep(2 * (attempt + 1))
    failed.append(item["th"])


async def main():
    items = json.load(sys.stdin)
    OUT.mkdir(parents=True, exist_ok=True)
    wanted = {f"{i['name']}.mp3" for i in items}
    for old in OUT.glob("*.mp3"):
        if old.name not in wanted:
            old.unlink()
    missing = [i for i in items if not (OUT / f"{i['name']}.mp3").exists()]
    gate, failed = asyncio.Semaphore(6), []
    await asyncio.gather(*(make(i, gate, failed) for i in missing))
    print(f"{len(items)} words, {len(missing)} created, {len(failed)} failed")


asyncio.run(main())
