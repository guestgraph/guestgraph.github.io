#!/usr/bin/env python3
"""Generate one narration clip per slide, per language, straight from the deck.

The deck is the only source: index.html holds both the spoken text and, in the
<em class='cue'> directions, the places the author meant to pause. A cue becomes a
paragraph break, and its data-tag becomes an eleven_v3 audio tag.

Both are nudges, not controls. Measured on slide 04: a [slowly] tag moved the
speaking rate 9% (EN) / 4% (DE), paragraph breaks and ellipses 2%, and the
voice_settings `speed` field — accepted by the API — changed nothing at all on
this model. Real pauses would have to be silence between separate clips, owned
by the player rather than requested from the model. Don't reach for `speed`.

Skips a clip whose text has not changed since it was last generated, so editing
one note does not cost a full regeneration.

A clip that comes back stopping mid-waveform is faded before it is written; see
polish() for why that is a second defect from the click `style` deals with.

  export ELEVENLABS_API_KEY=...
  ./generate.py [--voice ID] [--model eleven_v3] [--only 04] [--dry-run]
                                       # --voice overrides both languages; the
                                       # per-language default is VOICE below
"""
import argparse, hashlib, html, json, math, os, pathlib, re, shutil, subprocess, sys, tempfile, time, wave
import array

DECK = pathlib.Path(__file__).resolve().parent.parent / "index.html"
OUT = pathlib.Path(__file__).resolve().parent.parent / "audio"
# The narrating voices for GuestGraph — one per language, not one per repository.
#
# A voice that carries English well does not necessarily carry German well, and these
# decks narrate both; keeping the two separate lets each be chosen on its own merits.
# They are also deliberately different from the sibling repository's, so the product and
# the person do not sound like the same speaker.
#
# Changing either reprices only that language: the clip cache keys on
# sha256(voice|model|settings|text), so a new id invalidates that language's clips and
# leaves the other alone. Check the bill first —
#   ./generate.py --dry-run
# reports the exact character count without generating anything.
VOICE = {
    "en": "XrExE9yKIg1WjnnlVkGX",   # Matilda — knowledgable, professional
    "de": "cgSgspJ2msm6clMCkdW9",   # Jessica — playful, bright, warm
}

# How the voices deliver, shared by both languages.
#
# `style` is 0 because of what it does to the ends of sentences. At 0.45 the model
# over-articulates a final plosive into a release that detaches from the word: measured on
# slide 04 DE ("...ausgeschaltet"), a 20 ms stop closure followed by a 120 ms burst of
# noise, which the ear hears as a click rather than as a consonant. It is not damage to the
# file — regenerating reproduces it, and it survives any amount of fading, because it is
# speech. Three of the twenty-two clips showed it, all of them ending in "t", but which
# draws it lands on is luck, so the setting is the only durable guard. At 0 the same
# release measures 35 ms, the length of an ordinary spoken /t/.
#
# The cost is pace: the read is flatter and roughly 10% longer. Anything above 0 trades
# clean endings back for expressiveness — audition on one slide before moving it,
#   ./generate.py --only 04
# and listen to the last half-second, which is where the difference lives.
SETTINGS = {"stability": 0.4, "similarity_boost": 0.75,
            "style": 0.0, "use_speaker_boost": True}

def read_h1(block):
    """English content and the data-de attribute of the slide's <h1>.

    The deck is English-first: the markup carries the language the deck is delivered in,
    so it is correct before any JS runs, and German lives in data-de. This function was
    written the other way round and had to flip with the decks — if it is ever wrong, the
    symptom is a German title read in the English voice, which nothing but listening
    catches. `--dry-run` is the guard: the clip cache keys on the text, so a swap shows up
    immediately as every clip needing regeneration.

    Parsed by scanning for the tag's real closing '>' rather than with a regex: the data-de
    attribute contains <em> markup, so <h1[^>]*> ends inside the attribute and returns a
    fragment of the German title glued to the English one.
    """
    i = block.find("<h1")
    if i < 0:
        return None
    j, quote = i + 3, None
    while j < len(block):
        c = block[j]
        if quote:
            if c == quote:
                quote = None
        elif c in "\"'":
            quote = c
        elif c == ">":
            break
        j += 1
    tag, rest = block[i:j], block[j + 1:]
    end = rest.find("</h1>")
    inner = rest[:end] if end >= 0 else ""
    m = re.search(r'data-de="([^"]*)"', tag)
    strip = lambda t: html.unescape(re.sub(r"<[^>]+>", "", t)).replace("\xa0", " ").strip()
    return {"en": strip(inner), "de": strip(m.group(1)) if m else ""}

def slides(deck_html):
    """(index, {lang: spoken_text}) for every slide that has notes."""
    out = []
    # Comments go first: a block runs from one <section class="slide" to the next, so a
    # comment written *above* a slide lands in the previous slide's block. One that quotes
    # an attribute — data-say-title="no" — would otherwise be read as that attribute and
    # silently strip the previous slide's title. Explaining a flag must never set it.
    deck_html = re.sub(r"<!--.*?-->", "", deck_html, flags=re.S)
    for block in re.split(r'<section class="slide', deck_html)[1:]:
        n = re.search(r'data-n="(\d+)"', block)
        if not n:
            continue
        # the headline leads, so a listener hears the point before the argument for it.
        # Two slides opt out via data-say-title="no": the title slide, where the greeting is
        # the opening, and slide 04, where the note restates the headline almost verbatim.
        say_title = 'data-say-title="no"' not in block
        titles = {}
        if say_title:
            h1 = read_h1(block)
            if h1:
                titles["de"] = h1["de"]
                if h1["en"]:
                    titles["en"] = h1["en"]

        texts = {}
        for lang, attr in (("de", "data-notes"), ("en", "data-notes-en")):
            m = re.search(attr + r'="([^"]*)"', block)
            if not m:
                continue
            note = m.group(1)
            # A cue is a direction, never spoken. Two things survive it:
            #   position — it becomes a paragraph break, which is how the voice takes a beat;
            #   data-tag — an eleven_v3 audio tag steering the delivery of what follows.
            # The tag is authored, not inferred from the cue's prose: one tag serves both
            # languages, and guessing from wording is the kind of implicit rule that breaks
            # silently. Cues without a tag still just set a beat.
            # Single quotes are required — this markup lives inside a double-quoted attribute.
            chunks = re.split(r"(<em class='cue'[^>]*>.*?</em>)", note)
            plain = lambda t: html.unescape(re.sub(r"<[^>]+>", "", t)).strip()
            parts, tag = [], None
            for chunk in chunks:
                if chunk.startswith("<em class='cue'"):
                    hit = re.search(r"data-tag='([^']*)'", chunk)
                    tag = hit.group(1) if hit else None
                    continue
                text = plain(chunk)
                if text:
                    parts.append(f"{tag} {text}" if tag else text)
                    tag = None
            body = "\n\n".join(parts)
            t = titles.get(lang)
            texts[lang] = (t + "\n\n" + body) if t else body
        if texts:
            out.append((n.group(1), texts))
    return out

def speak(text, voice, model, key):
    """Via curl: this Python has no CA bundle, and curl uses the system trust store."""
    body = json.dumps({
        "text": text, "model_id": model, "voice_settings": SETTINGS,
    })
    r = subprocess.run(
        ["curl", "-sS", "--fail-with-body", "-X", "POST",
         f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
         "-H", f"xi-api-key: {key}", "-H", "Content-Type: application/json",
         "--data-binary", "@-"],
        input=body.encode(), capture_output=True, timeout=240)
    if r.returncode != 0 or r.stdout[:1] == b"{":
        raise RuntimeError((r.stdout or r.stderr)[:160].decode(errors="replace"))
    return r.stdout

# A clip sometimes comes back cut mid-waveform: full-amplitude one sample, digital
# silence the next. The ear hears the step as a click, the same complaint `style` above
# deals with but a different cause, and the two are independent — 04 DE arrived with both.
# It is a per-generation lottery rather than a setting: the clip that started this measured
# a step of 2077, regenerating it produced a clean taper, regenerating the whole deck put
# the defect on three other clips instead. Nothing in the request predicts it, so it is
# repaired on the way to disk rather than hoped away.
#
# Only a clip that actually has the step is touched. Everything else is written exactly as
# the API sent it, which keeps a second MP3 generation off the twenty-odd clips that do not
# need one.
STEP_CLICK = 500      # end step above this is audible; a clean taper measures single digits
FADE_MS    = 5.0      # raised cosine, long enough to kill the step and short enough to
                      # leave the final consonant's attack intact
TAIL_MS    = 150.0    # a beat of silence, so the clip ends rather than stops
_FLOOR     = 100      # below this is decoder ringing, not signal

def polish(mp3_bytes):
    """Fade a truncated clip's tail. Returns the bytes unchanged if it ends cleanly.

    lame does both directions, so the repair adds one dependency rather than two, and it
    is optional: without lame the clip is written as it arrived and the run says so. That
    is the right failure — an unfaded clip is the status quo, a missing clip is not.
    """
    if not shutil.which("lame"):
        return mp3_bytes, None
    wav = tempfile.mktemp(suffix=".wav")
    src = tempfile.mktemp(suffix=".mp3")
    try:
        pathlib.Path(src).write_bytes(mp3_bytes)
        subprocess.run(["lame", "--quiet", "--decode", src, wav], check=True)
        w = wave.open(wav); sr, ch = w.getframerate(), w.getnchannels()
        a = array.array("h"); a.frombytes(w.readframes(w.getnframes())); w.close()
    except (subprocess.CalledProcessError, OSError, wave.Error):
        return mp3_bytes, None
    finally:
        for f in (src, wav):
            if os.path.exists(f) and f != wav: os.unlink(f)

    end = next((i for i in range(len(a) - 1, -1, -1) if abs(a[i]) > _FLOOR), None)
    step = abs(a[end] - (a[end + 1] if end is not None and end + 1 < len(a) else 0)) if end else 0
    if end is None or step <= STEP_CLICK:
        os.path.exists(wav) and os.unlink(wav)
        return mp3_bytes, step

    a = a[:end + 1]
    n = int(sr * FADE_MS / 1000)
    for i in range(n):
        g = 0.5 * (1 + math.cos(math.pi * (i + 1) / n))
        a[len(a) - n + i] = int(a[len(a) - n + i] * g)
    a.extend([0] * int(sr * TAIL_MS / 1000) * ch)

    out = tempfile.mktemp(suffix=".mp3")
    try:
        f = wave.open(wav, "wb"); f.setnchannels(ch); f.setsampwidth(2)
        f.setframerate(sr); f.writeframes(a.tobytes()); f.close()
        subprocess.run(["lame", "--quiet", "-m", "m", "-b", "128", "--cbr", "-q", "0",
                        wav, out], check=True)
        return pathlib.Path(out).read_bytes(), step
    except (subprocess.CalledProcessError, OSError):
        return mp3_bytes, step
    finally:
        for f in (wav, out):
            if os.path.exists(f): os.unlink(f)

def main():
    ap = argparse.ArgumentParser()
    # --voice overrides both languages at once, which is what auditioning wants
    ap.add_argument("--voice")
    ap.add_argument("--model", default="eleven_v3")
    ap.add_argument("--only")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key and not a.dry_run:
        sys.exit("no ELEVENLABS_API_KEY")

    todo = slides(DECK.read_text())
    if a.only:
        todo = [t for t in todo if t[0] == a.only]

    chars = made = skipped = 0
    for idx, texts in todo:
        for lang, text in sorted(texts.items()):
            d = OUT / lang
            d.mkdir(parents=True, exist_ok=True)
            mp3, stamp = d / f"{idx}.mp3", d / f"{idx}.sha"
            voice = a.voice or VOICE[lang]
            # SETTINGS is in the key: without it, changing `style` above would leave
            # every clip looking current while the audio still carried the old delivery.
            sig = hashlib.sha256(
                f"{voice}|{a.model}|{json.dumps(SETTINGS, sort_keys=True)}|{text}"
                .encode()).hexdigest()
            if mp3.exists() and stamp.exists() and stamp.read_text().strip() == sig:
                skipped += 1
                continue
            chars += len(text)
            if a.dry_run:
                print(f"  would write {lang}/{idx}.mp3  {len(text):4} chars  "
                      f"{text.count(chr(10)+chr(10))+1} paragraph(s)")
                continue
            try:
                data, step = polish(speak(text, voice, a.model, key))
                mp3.write_bytes(data)
                stamp.write_text(sig)
                note = "" if step is None or step <= STEP_CLICK else f"  faded (step {step})"
                print(f"  ✓ {lang}/{idx}.mp3  {mp3.stat().st_size//1024:4} KB  {len(text):4} chars{note}")
                made += 1
                time.sleep(0.4)
            except Exception as e:
                # one bad clip must not abandon the other twenty-one
                print(f"  ✗ {lang}/{idx}: {e}")
    print(f"\n  generated {made}, unchanged {skipped}, characters billed ~{chars}")

if __name__ == "__main__":
    main()
