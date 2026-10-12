// ==UserScript==
// @name         Garbaty Panel Dodatków
// @version      7.0.0
// @description  Stary Garbaty Panel został wyłączony - zainstaluj nowy Garbaty Panel
// @author       Kuchar
// @match        https://*.margonem.pl/*
// @exclude      https://margonem.pl/
// @exclude      https://margonem.pl/*
// @exclude      https://www.margonem.pl/*
// @exclude      https://new.margonem.pl/*
// @exclude      https://forum.margonem.pl/*
// @exclude      https://blog.margonem.pl/*
// @exclude      https://addons.margonem.pl/*
// @exclude      https://addons2.margonem.pl/*
// @exclude      https://api.margonem.pl/*
// @exclude      https://support.margonem.pl/*
// @exclude      https://pomoc.margonem.pl/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @icon         https://cdn-icons-png.freepik.com/512/4594/4594548.png
// @updateURL    https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js
// @downloadURL  https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js
// ==/UserScript==

// Stary Garbaty Panel jest wyłączony. Ten skrypt niczego już nie ładuje (ani ze starego
// serwera, ani z GitHuba) — pokazuje tylko komunikat z instalacją nowego panelu.
(() => {
  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const INSTALL_URL = 'https://dev.garbatypanel.pl/gp-next.user.js';
  const DISCORD_URL = 'https://discord.gg/MdXVJFmgDf';
  const DONE_KEY = 'gp_old_loader_new_installed_notice';
  const newPanelNow = () => Boolean(W.__garbatyStableLoaderStarted || W.__gpNextLocalPrototype || W.GPRuntime);

  function el(tag, css, text) {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text) node.textContent = text;
    return node;
  }
  function show() {
    if (W.top !== W.self || document.getElementById('gp-old-loader-notice')) return;
    const installed = newPanelNow();
    if (installed && GM_getValue(DONE_KEY, false)) return;
    const box = el('div', 'position:fixed;right:12px;bottom:12px;z-index:2147483646;width:min(310px,90vw);padding:12px 30px 12px 14px;' +
      'border:1px solid #b58b3b;border-radius:8px;background:#15110cf2;color:#f1e6cf;font:12px/1.45 Arial,sans-serif;box-shadow:0 6px 20px #000a');
    box.id = 'gp-old-loader-notice';
    const title = installed ? 'Nowy Garbaty Panel działa' : 'Stary Garbaty Panel został wyłączony';
    const text = installed
      ? 'Stary skrypt „Garbaty Panel Dodatków” nie jest już potrzebny. Możesz go usunąć w Tampermonkey.'
      : 'Zainstaluj nowy Garbaty Panel, potem usuń ten stary skrypt w Tampermonkey i odśwież grę. Ustawienia dodatków ustawisz na nowo w nowym panelu.';
    box.append(el('div', 'font-weight:bold;font-size:14px;color:#e7b75a;margin-bottom:5px', title), el('div', '', text));
    if (!installed) {
      const install = el('button', 'display:block;margin-top:9px;padding:7px 12px;border:1px solid #e7b75a;border-radius:5px;' +
        'background:#e7b75a;color:#1a130b;font:bold 12px Arial,sans-serif;cursor:pointer', 'Zainstaluj nowy Garbaty Panel');
      install.type = 'button';
      install.addEventListener('click', () => W.open(INSTALL_URL, '_blank'));
      box.append(install);
    }
    const help = el('a', 'display:block;margin-top:8px;color:#b4a280;font-size:11px', 'Pomoc i ranga na Discordzie');
    help.href = DISCORD_URL;
    help.target = '_blank';
    help.rel = 'noopener';
    const close = el('span', 'position:absolute;right:9px;top:5px;cursor:pointer;font-size:16px;color:#b4a280', '×');
    close.title = 'Zamknij';
    close.addEventListener('click', () => {
      box.remove();
      if (installed) GM_setValue(DONE_KEY, true);
    });
    box.append(help, close);
    (document.body || document.documentElement).appendChild(box);
  }
  // Chwila po wczytaniu gry, żeby nowy panel (jeśli jest) zdążył się zgłosić.
  setTimeout(show, 4000);
})();
