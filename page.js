// @robertblust/design v0.80.3 — page.js, assembled from the shared blocks
// and copied into this site by `npm run design`. Editing it here does nothing: the
// next `npm run design` overwrites it from the package. Change it there instead.

(function () {
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

(function(){
  var root = document.documentElement, bar = document.querySelector(".bar");
  // Loud, because the quiet version cost an afternoon. This fence belongs at the end of the
  // body, beside `theme`; put in the head beside `theme boot` — one marker's worth of
  // difference, and `end theme` is a prefix of `end theme boot` — the row is not in the DOM
  // yet, and a block that returned here would leave every page uncollapsed with nothing
  // anywhere saying why. An uncaught exception is reported by every suite's pageerror
  // listener, which is the difference between a wasted hour and a red check.
  if (!bar) {
    throw new Error("nav fit: this page has no .bar yet. The block belongs at the end of " +
      "the body, after the theme fence, not in the head beside theme boot.");
  }
  var pending = false;
  function fit(){
    pending = false;
    root.removeAttribute("data-nav");
    var wrap = bar.style.flexWrap;
    bar.style.flexWrap = "nowrap";
    var over = bar.scrollWidth > bar.clientWidth;
    bar.style.flexWrap = wrap;
    if (over) root.setAttribute("data-nav", "compact");
  }
  // One read per frame at most: a drag across the breakpoint fires resize continuously, and
  // each run forces layout twice.
  function soon(){ if (!pending) { pending = true; requestAnimationFrame(fit); } }
  window.addEventListener("resize", soon);
  // The language switch rewrites the links through innerHTML, so the row's width changes
  // without anything resizing. Watching the attribute rather than being called keeps this
  // block out of every page's own applyLang.
  new MutationObserver(soon).observe(root, { attributes: true, attributeFilter: ["lang"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
})();
})();
