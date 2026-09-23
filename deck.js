// @robertblust/design v0.82.0 — deck.js, assembled from the shared blocks
// and copied into this site by `npm run design`. Editing it here does nothing: the
// next `npm run design` overwrites it from the package. Change it there instead.

(function () {
var THEME_KEY = "theme";
function themeStored(){ try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
function themeRemember(v){ try { localStorage.setItem(THEME_KEY, v); } catch (e) {} }
var theme = (typeof theme !== "undefined") ? theme
  : (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

/* Each origin keeps its own localStorage, so a visitor reading in light who followed a link
   to a sibling site would arrive in dark — three copies of one preference, none of which can
   see the others. The theme rides along instead, on the same terms as the language: the param
   is added at click time, never at load, so no link in the served markup carries it and
   nothing crawlable or bookmarkable does either. */
var THEME_FAMILY = /^(www\.)?(blust\.ch|companygraph\.io|guestgraph\.io)$/;
function themeFromUrl(){
  var m = /[?&]theme=(light|dark)(&|$)/.exec(location.search);
  if (!m) return null;
  try {
    var q = location.search.replace(/([?&])theme=(light|dark)(&|$)/, "$1").replace(/[?&]$/, "");
    history.replaceState(null, "", location.pathname + q + location.hash);
  } catch (e) {}
  return m[1];
}
// Language gets away with always decorating a link because a visitor's language is always an
// explicit two-way choice. Theme is not: it has a default (dark), and a page that carries only
// the default is indistinguishable from a page whose visitor chose it. Carrying `theme` on
// every link exported that default as though it were a choice — a visitor who set light on one
// site and later opened a sibling fresh (dark, correct, untouched) would have that default
// carried back onto a link to the first site and silently overwrite their real, stored
// preference. Reading `themeStored()` rather than the in-memory `theme` variable is what keeps
// this to "only when the visitor actually chose": nothing stored means nothing carried, and no
// link is decorated.
function carryTheme(e){
  var stored = themeStored();
  if (!stored) return;
  var a = e.target && e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
  if (u.origin === location.origin || !THEME_FAMILY.test(u.hostname)) return;
  u.searchParams.set("theme", stored);
  a.href = u.toString();
}
// mousedown as well as click, so a middle-click or cmd-click into a new tab carries it too.
// This runs alongside the language block's identical pair; the second listener reads the href
// the first rewrote, so the two compose into ?lang=de&theme=light rather than racing.
document.addEventListener("mousedown", carryTheme, true);
document.addEventListener("click", carryTheme, true);

function applyTheme(){
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  var l = document.getElementById("thLight"), d = document.getElementById("thDark");
  if (l) l.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  if (d) d.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
}
function setTheme(v){ theme = v; themeRemember(v); applyTheme(); }

var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
// slide numbering is zero-based everywhere the viewer can see it: the kicker on each
// slide, the transport's display window, and the audio filenames all say the same number.
function pad(n){ return (n < 10 ? '0' : '') + n; }
// The language choice is shared with the other pages on this origin, so arriving from
// the talks index keeps the language the reader already picked. Storage is guarded:
// file:// is an opaque origin in some browsers and throws, and a deck that cannot read
// a preference must still open — in English, its default.
/* ─── language · v5 · deck ─────────────────────────────────────────────
   One language across three domains, and where it is remembered. Generated
   from @robertblust/design — editing it here does nothing, because the next
   `npm run design` overwrites it. Change it in the package.

   A fenced copy sits inside the page's own script and sees whatever the page declared above
   it; a copy loaded as `page.js` or `deck.js` is its own file and sees nothing of the page
   at all. So this block takes `lang` from `window.rbPage.lang` when a page declares one,
   falls back to a `lang` already in scope when a fenced page still declares its own, and
   defaults to `"en"` when neither exists — read with `typeof lang !== "undefined"`, never a
   bare `lang`, so the absence of either throws nothing. Once decided, it calls
   `window.rbPage.applyLang(lang)` when the page declared one, the same way guarded: a page
   with no `data-de` needs no `applyLang` and gets none called.

   The key is `lang`, the family's: one name on three origins, the same word the address
   carries. A storage key is a promise to every visitor, and this one is made once, for the
   family, by the package, so that no site can make it differently.
*/
var LANG_KEY = "lang";
function langStored(){ try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
function langRemember(v){ try { localStorage.setItem(LANG_KEY, v); } catch (e) {} }
var lang = (window.rbPage && typeof window.rbPage.lang !== "undefined") ? window.rbPage.lang
  : (typeof lang !== "undefined" ? lang : "en");
if (window.rbPage && typeof window.rbPage.applyLang === "function") window.rbPage.applyLang(lang);

/* One language across three domains. Each origin keeps its own localStorage, so a
   visitor reading German here and following a link to a sibling site would arrive in
   English — three copies of one preference, none of which can see the others. The
   language rides along instead: a link to a family domain gets ?lang= at the moment it
   is clicked, and a page that arrives with one adopts it, stores it, and takes it back
   out of the address bar.

   Decorated at click time, never at load. A family link can sit inside a data-de
   attribute, and switching language replaces that element whole — an href rewritten at
   load would be discarded by the first toggle. It also means no link in the served
   markup carries the param, so nothing crawlable, copyable or bookmarkable does either;
   the address bar is cleaned by replaceState the moment the page reads it. */
var FAMILY = /^(www\.)?(blust\.ch|companygraph\.io|guestgraph\.io)$/;
function langFromUrl(){
  var m = /[?&]lang=(de|en)(&|$)/.exec(location.search);
  if (!m) return null;
  try {
    var q = location.search.replace(/([?&])lang=(de|en)(&|$)/, "$1").replace(/[?&]$/, "");
    history.replaceState(null, "", location.pathname + q + location.hash);
  } catch (e) {}
  return m[1];
}
/* `lang` above is read once, when this script runs. That is fine for the fenced form, where
   it is the page's own variable and the page's own toggle mutates it directly — but a copy
   loaded as `page.js` or `deck.js` runs inside its own closure, so its `lang` is a private
   snapshot nothing after load ever updates. A visitor who switches language after the file
   has already run kept having every family link decorated with the language the page
   arrived with, forever after — measured on blust.ch's /ideas/, where a link to a sibling
   site carried the stale value once the file shape shipped there.

   `document.documentElement.lang` is the live truth instead: every page's own `applyLang`
   sets it, fenced or filed, so reading it at click time sees a switch the instant it
   happens. The captured `lang` is kept only as a fallback, for the one case the attribute
   cannot answer — a page that has not called `applyLang` at all, or set the attribute to
   something outside the two languages the family carries. */
function carryLang(e){
  var a = e.target && e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
  if (u.origin === location.origin || !FAMILY.test(u.hostname)) return;
  var docLang = document.documentElement.lang;
  var live = (docLang === "de" || docLang === "en") ? docLang : lang;
  u.searchParams.set("lang", live);
  a.href = u.toString();
}
// mousedown as well as click, so a middle-click or a cmd-click opening a new tab
// carries the language too; both fire before the browser follows the href.
document.addEventListener("mousedown", carryLang, true);
document.addEventListener("click", carryLang, true);

/* An aria-label is markup the switch cannot reach through innerHTML, so a label that had
   to be read in both languages was written bilingual, "Menü — menu", and put an em-dash
   into German. Every element that carries data-de-aria gets the label for the language
   whenever <html lang> changes; the English is captured here on load, as data-en-aria, and
   never written by hand. The block watches the attribute rather than being called, so a
   page adds nothing to its own applyLang and the contract above does not grow. */
function ariaI18n(){ return Array.prototype.slice.call(document.querySelectorAll("[data-de-aria]")); }
function applyAria(){
  var l = document.documentElement.lang === "de" ? "de" : "en";
  ariaI18n().forEach(function(el){
    if (!el.hasAttribute("data-en-aria")) el.setAttribute("data-en-aria", el.getAttribute("aria-label") || "");
    el.setAttribute("aria-label", el.getAttribute("data-" + l + "-aria"));
  });
}
function watchAria(){
  applyAria();
  if (window.MutationObserver)
    new MutationObserver(applyAria).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchAria); else watchAria();
/* ─── end language ─────────────────────────────────────────────────── */


var urlLang = langFromUrl();
if (urlLang) langRemember(urlLang);
var i = 0, notesOpen = false, lang = urlLang || (langStored() === 'de' ? 'de' : 'en');
var deck = document.getElementById('deck');
var bar = document.getElementById('bar'), cur = document.getElementById('cur');
var notes = document.getElementById('notes'), ntext = document.getElementById('ntext'), ntime = document.getElementById('ntime');
var chrome = document.getElementById('chrome');
var cliplen = document.getElementById('cliplen');
var btn = { first:document.getElementById('tFirst'), prev:document.getElementById('tPrev'),
            play:document.getElementById('tPlay'),  next:document.getElementById('tNext'),
            full:document.getElementById('tFull'),  notes:document.getElementById('tNotes') };
var langDe = document.getElementById('langDe'), langEn = document.getElementById('langEn');
document.getElementById('tot').textContent = pad(slides.length - 1);

var i18n = Array.prototype.slice.call(document.querySelectorAll('[data-de]'));
i18n.forEach(function(el){ el.setAttribute('data-en', el.innerHTML); });

var TALK = (window.rbDeck && typeof window.rbDeck.talk !== "undefined") ? window.rbDeck.talk
  : (typeof TALK !== "undefined" ? TALK : undefined);
var UI = (window.rbDeck && typeof window.rbDeck.ui !== "undefined") ? window.rbDeck.ui : {
  de:{ label:'Sprecher-Notiz', close:'Notizen schliessen',
       title:TALK.de.title, desc:TALK.de.desc,
       play:'Vortrag abspielen', pause:'Vortrag pausieren', first:'Zurück zum Anfang',
       prev:'Vorherige Folie', next:'Nächste Folie', full:'Vollbild', unfull:'Vollbild verlassen',
       notes:'Sprecher-Notizen', de:'Auf Deutsch', en:'Auf Englisch', up:'Zurück zu allen Vorträgen' },
  en:{ label:'Speaker note', close:'Close notes',
       title:TALK.en.title, desc:TALK.en.desc,
       play:'Play the talk', pause:'Pause the talk', first:'Back to the start',
       prev:'Previous slide', next:'Next slide', full:'Fullscreen', unfull:'Leave fullscreen',
       notes:'Speaker notes', de:'In German', en:'In English', up:'Back to all talks' }
};

function applyLang(){
  i18n.forEach(function(el){ el.innerHTML = el.getAttribute('data-' + lang); });
  var t = UI[lang];
  document.title = t.title;
  document.getElementById('metadesc').setAttribute('content', t.desc);
  document.getElementById('noteslabel').textContent = t.label;
  document.getElementById('notesclose').textContent = t.close;
  langDe.setAttribute('aria-pressed', lang === 'de' ? 'true' : 'false');
  langEn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
  langDe.setAttribute('aria-label', t.de);
  langEn.setAttribute('aria-label', t.en);
  btn.first.setAttribute('aria-label', t.first);
  btn.prev.setAttribute('aria-label', t.prev);
  btn.next.setAttribute('aria-label', t.next);
  btn.notes.setAttribute('aria-label', t.notes);
  var up = document.getElementById('tUp');
  up.setAttribute('aria-label', t.up);
  up.setAttribute('title', t.up);
  labelPlay();
  labelFull();
  document.documentElement.lang = lang;
  if (playing) {
    if (synth) synth.cancel();
    clip.pause();
    setTimeout(narrateCurrent, 120);
  }
  render();
}

// aria-disabled, read by both render() and the handlers below — see the comment in
// render() for why this is not the `disabled` property.
function setInert(el, on){ el.setAttribute('aria-disabled', on ? 'true' : 'false'); }
function isInert(el){ return el.getAttribute('aria-disabled') === 'true'; }

/* The transport is a real element with a measured height, and two other things have to
   land exactly on top of it: the notes sheet, and the progress bar on mobile. */
function measureChrome(){
  document.documentElement.style.setProperty('--chromeH', chrome.offsetHeight + 'px');
}

function fitNotes(){
  var s = slides[i];
  s.style.transform = '';
  if(!notesOpen) return;
  var avail = notes.getBoundingClientRect().top - 20;
  var need  = s.scrollHeight;
  if(need > avail){ s.style.transform = 'scale(' + Math.max(0.5, avail/need) + ')'; }
}

function render(){
  slides.forEach(function(s,n){ if(n!==i) s.style.transform=''; s.classList.toggle('active', n===i); });
  bar.style.width = ((i+1)/slides.length*100) + '%';
  cur.textContent = pad(i);
  if(notesOpen){
    var d = slides[i].dataset;
    /* `data-notes` is English and `data-notes-de` the translation, which is `data-de`'s
       pairing and the page's: the source markup is English and German is what an
       attribute carries. It used to be the other way round for notes alone — the base
       attribute held German while English was the suffixed one — so the base attribute
       meant a different language depending on which of the two you were reading. */
    ntext.innerHTML = (lang === 'de' && d.notesDe) ? d.notesDe : d.notes;
    ntime.textContent = d.time || '';
  }
  /* The ends of the deck, made visible. go() has always clamped, so these controls
     were already no-ops here — this is the state saying so rather than a click that
     does nothing. `first` goes with `prev`: at slide zero it is equally inert, and
     dimming one while the other stays lit next to it reads as a bug.

     `aria-disabled`, not `disabled`: a real `disabled` removes the control from the
     tab order the instant it takes effect, and it can take effect while the control
     holds focus — the user's own Enter, at slide zero, disables `tPrev` under itself
     and the browser drops focus to <body>. `aria-disabled` keeps the same look (see
     `deck transport`'s `.tbtn[aria-disabled="true"]`) and the same announced state
     without moving focus anywhere; the click and keydown handlers below check it and
     return early, so the control still does nothing while it is inert. */
  setInert(btn.prev, i === 0);
  setInert(btn.first, i === 0);
  setInert(btn.next, i === slides.length - 1);
  fitNotes();
}
window.addEventListener('resize', function(){ measureChrome(); fitNotes(); });
function go(n){ i = Math.max(0, Math.min(slides.length-1, n)); render(); }

/* Turning the page by hand does not end the talk — the voice follows to the slide you
   landed on. JUMP_MS is why: it lets someone click through five slides and hear only the
   fifth, instead of a syllable of each one on the way. Back to the start is the exception,
   because going back to slide zero is leaving the talk, not moving inside it. */
var JUMP_MS = 400;

function manual(n){
  if (!playing) { go(n); return; }
  stopVoice();
  go(n);
  gapTimer = setTimeout(function(){ if (playing) narrateCurrent(); }, JUMP_MS);
}

function restart(){ if (playing) stopNarration(); go(0); }

function setNotes(open){
  notesOpen = open;
  notes.classList.toggle('show', notesOpen);
  // the closed sheet is only translated off-screen, so its close button would otherwise
  // still be a tab stop for something nobody can see
  notes.toggleAttribute('inert', !notesOpen);
  deck.classList.toggle('notes-open', notesOpen);
  btn.notes.setAttribute('aria-pressed', notesOpen ? 'true' : 'false');
  render();
}

function labelFull(){
  var on = !!document.fullscreenElement;
  btn.full.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.full.setAttribute('aria-label', on ? UI[lang].unfull : UI[lang].full);
}
function toggleFull(){
  if(!document.fullscreenElement){
    var r = document.documentElement.requestFullscreen();
    if (r && r.catch) r.catch(function(){});
  } else { document.exitFullscreen(); }
}
document.addEventListener('fullscreenchange', function(){ labelFull(); measureChrome(); });

function setLang(next){ if (next === lang) return; lang = next; langRemember(next); applyLang(); }

// Each guard reads the control's own aria-disabled rather than the i===0 / last-slide
// condition directly: the control's state, set once in render(), is the single source
// both the click and the paint read, rather than two places computing the same thing.
btn.first.addEventListener('click', function(){ if (isInert(btn.first)) return; restart(); });
btn.prev .addEventListener('click', function(){ if (isInert(btn.prev))  return; manual(i-1); });
btn.next .addEventListener('click', function(){ if (isInert(btn.next))  return; manual(i+1); });
btn.play .addEventListener('click', function(){ toggleNarration(); });
btn.full .addEventListener('click', toggleFull);
btn.notes.addEventListener('click', function(){ setNotes(!notesOpen); });
document.getElementById('notesclose').addEventListener('click', function(){ setNotes(false); });
langDe.addEventListener('click', function(){ setLang('de'); });
langEn.addEventListener('click', function(){ setLang('en'); });

/* The deck is driven by the buttons. These keys stay because a presenter remote sends
   them — it is a clicker pretending to be a keyboard — and are deliberately not
   advertised anywhere on screen. */
document.addEventListener('keydown', function(e){
  if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){ manual(i+1); e.preventDefault(); }
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){ manual(i-1); e.preventDefault(); }
  else if(e.key==='Home'){ restart(); e.preventDefault(); }
  else if(e.key==='End'){ manual(slides.length-1); e.preventDefault(); }
});

/* Swipe turns the page on touch. A mostly-vertical drag is someone scrolling a long
   slide, which portrait layout makes routine, so only a decisively horizontal one counts. */
var tx = 0, ty = 0, tt = 0;
deck.addEventListener('touchstart', function(e){
  if (e.touches.length !== 1) { tt = 0; return; }
  tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now();
}, {passive:true});
deck.addEventListener('touchend', function(e){
  if (!tt || Date.now() - tt > 700) return;
  var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
  manual(dx < 0 ? i + 1 : i - 1);
}, {passive:true});

measureChrome();
setNotes(false);
applyLang();

/* ---------- narration ----------
   The speaker notes mix stage directions with what is actually said: the <em class='cue'>
   spans are Regie-Instruktionen, the rest is Sprechtext. Only the latter is spoken.

   A recorded clip is played when one exists (audio/<lang>/<nn>.mp3), and the browser's own
   voice reads the note when one does not — so a half-recorded deck still plays end to end.

   Nothing is timed either way. Each slide advances on the end event of whichever source spoke,
   so the deck follows the voice rather than a clock, and stays correct when a note is edited or
   a clip is re-recorded. The data-time cues are untouched: they are the presenter's pacing for
   the live talk, which runs about three times longer than the narration and is a different
   timeline entirely. */
var synth = window.speechSynthesis;
var clip = new Audio();
clip.preload = 'auto';
var playing = false, utter = null, gapTimer = null;

// audio needs no speech synthesis, so the control stays even where synthesis is missing

function labelPlay(){
  var l = playing ? UI[lang].pause : UI[lang].play;
  btn.play.setAttribute('aria-label', l);
  btn.play.setAttribute('aria-pressed', playing ? 'true' : 'false');
  btn.play.classList.toggle('on', !!playing);
}

// the hairline under the track number: how far into this slide's clip the voice is
function setClipProgress(f){ cliplen.style.width = Math.max(0, Math.min(1, f)) * 100 + '%'; }
clip.addEventListener('timeupdate', function(){
  if (playing && clip.duration) setClipProgress(clip.currentTime / clip.duration);
});

/* The headline, read as the spoken lead-in. On screen it is the thing the eye lands on
   first; in audio nothing announced it, so the argument arrived before its own point. */
function slideTitle(slide){
  if (slide.dataset.sayTitle === 'no') return '';
  var h = slide.querySelector('h1');
  if (!h) return '';
  var raw = (lang === 'en' && h.dataset.en) ? h.dataset.en : h.innerHTML;
  var d = document.createElement('div'); d.innerHTML = raw;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function spokenText(slide){
  var raw = (lang === 'de' && slide.dataset.notesDe) ? slide.dataset.notesDe : slide.dataset.notes;
  if (!raw) return '';
  var d = document.createElement('div');
  d.innerHTML = raw;
  // only the directions: a bare <em> is emphasis inside the sentence and must be spoken,
  // or the voice loses the word the line turns on
  d.querySelectorAll('em.cue').forEach(function(e){ e.remove(); });
  var body = (d.textContent || '').replace(/\s+/g, ' ').trim();
  var title = slideTitle(slide);
  return title ? title + '\n\n' + body : body;
}

function pickVoice(){
  var want = lang === 'de' ? 'de' : 'en';
  var voices = synth.getVoices() || [];
  var exact = voices.filter(function(v){ return v.lang && v.lang.toLowerCase().indexOf(want) === 0; });
  if (!exact.length) return null;
  // prefer a local voice: network voices stall the onend event the deck advances on
  return exact.filter(function(v){ return v.localService; })[0] || exact[0];
}

function say(text, whenDone){
  utter = new SpeechSynthesisUtterance(text);
  var v = pickVoice();
  if (v) utter.voice = v;
  utter.lang = v ? v.lang : (lang === 'de' ? 'de-DE' : 'en-GB');
  utter.rate = 0.98;
  utter.onend = function(){ if (playing) whenDone(); };
  utter.onerror = function(){ stopNarration(); };
  // a throwing speak() would otherwise leave the deck stuck in a playing state that
  // never advances, because onend can no longer fire
  try { synth.speak(utter); } catch (e) { stopNarration(); }
}

function clipUrl(n){
  var k = slides[n].querySelector('.kicker');
  var id = k && k.dataset.n ? k.dataset.n : ('0' + n).slice(-2);
  return 'audio/' + lang + '/' + id + '.mp3';
}

/* Fetch the next clip while this one plays, so the gap between slides is the pause we
   intended rather than a download. */
function preloadNext(){
  if (i + 1 >= slides.length) return;
  var a = new Audio(); a.preload = 'auto'; a.src = clipUrl(i + 1);
}

function narrateCurrent(){
  if (!playing) return;
  setClipProgress(0);
  var text = spokenText(slides[i]);
  if (!text) { advanceOrStop(); return; }

  clip.onended = function(){ if (playing) advanceOrStop(); };
  clip.onerror = function(){
    // no recording for this slide or this language — read the note instead
    if (playing) say(text, advanceOrStop);
  };
  clip.src = clipUrl(i);
  var started = clip.play();
  if (started && started.catch) {
    started.then(preloadNext).catch(function(){ if (playing) say(text, advanceOrStop); });
  } else {
    preloadNext();
  }
}

/* Two pauses, doing different jobs. SETTLE sits on the slide that was just narrated, so the
   point has a moment to land before it is taken away. READ sits on the new slide before the
   voice starts, so it can be read first — a listener has no presenter to watch, and a slide
   talked over from the first frame is a slide nobody reads. */
var SETTLE_MS = 5000;
var READ_MS   = 2000;

function advanceOrStop(){
  if (!playing) return;
  if (i >= slides.length - 1) { stopNarration(); return; }
  gapTimer = setTimeout(function(){
    if (!playing) return;
    go(i + 1);
    gapTimer = setTimeout(function(){ if (playing) narrateCurrent(); }, READ_MS);
  }, SETTLE_MS);
}

function startNarration(){
  // synthesis is only the fallback now, so its absence is not a reason to refuse
  if (!synth) { playing = true; labelPlay(); narrateCurrent(); return; }
  playing = true;
  labelPlay();
  narrateCurrent();
}

// silence whatever is speaking, without deciding whether the talk is over
function stopVoice(){
  clearTimeout(gapTimer);
  clip.pause();
  clip.onended = clip.onerror = null;
  if (synth) synth.cancel();
  setClipProgress(0);
}

function stopNarration(){
  playing = false;
  stopVoice();
  labelPlay();
}

function toggleNarration(){ playing ? stopNarration() : startNarration(); }

// voices load asynchronously in some browsers
if (synth && typeof synth.onvoiceschanged !== 'undefined') {
  synth.addEventListener('voiceschanged', function(){ /* refresh list */ });
}
window.addEventListener('beforeunload', function(){ if (synth) synth.cancel(); });

// Scale the fixed-height canvas to the screen. Below the breakpoint the deck reflows
// into a scrolling reading view instead, so the transform is cleared there.
// Two of these decks once described this canvas by a fixed 16:9 size instead —
// the shape that letterboxed a 4:3 screen, not a design to restore.
(function(){
  var CH = 900;
  var deck = document.getElementById("deck");
  var small = window.matchMedia("(max-width: 860px), (max-aspect-ratio: 4/5)");
  function fit(){
    if (small.matches) { deck.style.transform = ""; deck.style.width = ""; return; }
    // Height is the fixed dimension; width is whatever the screen's aspect asks
    // for. The canvas then covers the viewport exactly — no bars, any aspect.
    var s = window.innerHeight / CH;
    deck.style.width = (window.innerWidth / s) + "px";
    deck.style.transform = "scale(" + s + ")";
  }
  window.addEventListener("resize", fit);
  if (small.addEventListener) small.addEventListener("change", fit);
  fit();
})();
})();
