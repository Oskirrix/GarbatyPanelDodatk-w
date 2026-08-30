// ==UserScript==
// @name         Garbaty Panel Dodatków
// @version      6.10.4
// @description  Bezpieczny loader Garbatego Panelu
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

/* GARBATY_FORCE_UPDATE_V1 */
const __GARBATY_LOADER_VERSION__ = '6.10.4';
const __GARBATY_VERSION_URL__ = 'https://raw.githubusercontent.com/Oskirrix/GarbatyPanelDodatk-w/main/loader-version.json';
let __GARBATY_UPDATE_URL__ = 'https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js';

function __garbatyCompareVersions(a, b) {
  const pa = String(a || '').split('.').map(v => Number(v) || 0);
  const pb = String(b || '').split('.').map(v => Number(v) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

function __garbatyOpenLatestInstaller() {
  window.open(__GARBATY_UPDATE_URL__, '_blank', 'noopener,noreferrer');
}

function __garbatyCreateUpdateButton(label = 'AKTUALIZUJ PANEL') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = 'garbaty-loader-update-button';
  button.style.cssText = [
    'display:block',
    'width:100%',
    'margin-top:8px',
    'padding:10px 12px',
    'border:1px solid #715b26',
    'border-radius:4px',
    'background:#29261d',
    'color:#eee',
    'font-weight:700',
    'cursor:pointer'
  ].join(';');
  button.addEventListener('click', __garbatyOpenLatestInstaller);
  return button;
}

function __garbatyShowRequiredUpdate(requiredVersion) {
  document.getElementById('garbaty-force-update-required')?.remove();
  document.getElementById('garbaty-secure-loader-message')?.remove();

  const box = document.createElement('div');
  box.id = 'garbaty-force-update-required';
  box.style.cssText = [
    'position:fixed',
    'left:50%',
    'top:50%',
    'transform:translate(-50%,-50%)',
    'z-index:2147483647',
    'width:min(430px,calc(100vw - 32px))',
    'box-sizing:border-box',
    'padding:22px',
    'border:1px solid #715b26',
    'border-radius:7px',
    'background:#131516',
    'color:#ddd',
    'font:14px Arial,sans-serif',
    'text-align:center',
    'box-shadow:0 12px 35px rgba(0,0,0,.65)'
  ].join(';');

  const title = document.createElement('div');
  title.textContent = 'Wymagana aktualizacja Garbatego Panelu';
  title.style.cssText = 'font-size:18px;font-weight:700;margin-bottom:9px;color:#d5b764';

  const text = document.createElement('div');
  text.textContent = `Masz wersję ${__GARBATY_LOADER_VERSION__}. Wymagana jest wersja ${requiredVersion} lub nowsza.`;
  text.style.cssText = 'line-height:1.5;color:#aaa';

  box.append(title, text, __garbatyCreateUpdateButton());
  (document.body || document.documentElement).appendChild(box);
}

async function __garbatyCheckRequiredVersion() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${__GARBATY_VERSION_URL__}?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) return false;

    const data = await response.json();
    const requiredVersion = String(data?.requiredVersion || data?.version || '').trim();
    const downloadUrl = String(data?.downloadUrl || '').trim();
    if (downloadUrl) __GARBATY_UPDATE_URL__ = downloadUrl;
    if (!requiredVersion) return false;

    if (__garbatyCompareVersions(__GARBATY_LOADER_VERSION__, requiredVersion) < 0) {
      __garbatyShowRequiredUpdate(requiredVersion);
      return true;
    }
  } catch (_) {
    // Awaria GitHuba nie blokuje panelu. Mechanizm ma blokować tylko przy
    // jednoznacznej informacji o wymaganej nowszej wersji.
  }
  return false;
}

function __garbatyAddUpdateButtonToFailure() {
  const panel = document.getElementById('garbaty-secure-loader-message');
  if (!panel) return;
  const text = String(panel.textContent || '');
  if (!text.includes('Nie udało się uruchomić panelu')) return;
  if (panel.querySelector('.garbaty-loader-update-button')) return;
  panel.appendChild(__garbatyCreateUpdateButton());
}

function __garbatyWatchLoaderFailures() {
  __garbatyAddUpdateButtonToFailure();
  if (window.__garbatyLoaderUpdateFailureObserver) return;
  const root = document.documentElement;
  if (!root) return;
  const observer = new MutationObserver(__garbatyAddUpdateButtonToFailure);
  observer.observe(root, { childList: true, subtree: true });
  window.__garbatyLoaderUpdateFailureObserver = observer;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __garbatyWatchLoaderFailures, { once: true });
} else {
  __garbatyWatchLoaderFailures();
}
/* /GARBATY_FORCE_UPDATE_V1 */

function _0x3a87(_0xb9ed15,_0x2847db){_0xb9ed15=_0xb9ed15-0xca;const _0x2f2f02=_0x2f2f();let _0x3a875f=_0x2f2f02[_0xb9ed15];return _0x3a875f;}(function(_0x78d97a,_0xf3b6ea){const _0x279173=_0x3a87,_0x2e150e=_0x78d97a();while(!![]){try{const _0xd1bac2=-parseInt(_0x279173(0x156))/0x1+-parseInt(_0x279173(0x184))/0x2+-parseInt(_0x279173(0x10a))/0x3+-parseInt(_0x279173(0x181))/0x4+parseInt(_0x279173(0x177))/0x5*(parseInt(_0x279173(0x132))/0x6)+parseInt(_0x279173(0x157))/0x7+parseInt(_0x279173(0x108))/0x8;if(_0xd1bac2===_0xf3b6ea)break;else _0x2e150e['push'](_0x2e150e['shift']());}catch(_0xcb8ae4){_0x2e150e['push'](_0x2e150e['shift']());}}}(_0x2f2f,0xe98b8),(async function(){'use strict';if(await __garbatyCheckRequiredVersion())return;const _0x71612f=_0x3a87;const _0xc9c0d0=typeof unsafeWindow!=='undefined'?unsafeWindow:window,_0x414d65='6.10.4',_0x4574fb=Object['freeze']({'baseUrl':'https://garbaty-panel-api-rw39.onrender.com','panelPath':_0x71612f(0xe7),'roleRefreshPath':'/api/auth/refresh-role','loginPath':_0x71612f(0x16f),'discordInviteUrl':_0x71612f(0xf0),'tokenKey':_0x71612f(0x12a),'sharedTokenKey':_0x71612f(0x103),'joinStepKey':'garbaty_discord_join_step_completed_v1','messageType':_0x71612f(0x113)});_0xc9c0d0[_0x71612f(0x148)]=_0x414d65;function _0x156d17(){const _0x1ed78e=_0x71612f;document[_0x1ed78e(0x13a)](_0x1ed78e(0x144))?.[_0x1ed78e(0x12d)](),document['getElementById'](_0x1ed78e(0x185))?.[_0x1ed78e(0x12d)]();}function _0x654853(){const _0x34e2b4=_0x71612f;if(!document[_0x34e2b4(0x13a)]('garbaty-loader-blocked-page-style')){const _0xad1144=document['createElement']('style');_0xad1144['id']='garbaty-loader-blocked-page-style',_0xad1144[_0x34e2b4(0x15a)]=_0x34e2b4(0x15d),(document[_0x34e2b4(0xe9)]||document[_0x34e2b4(0x106)])[_0x34e2b4(0x100)](_0xad1144);}_0x156d17();if(document[_0x34e2b4(0x106)]&&!_0xc9c0d0['__garbatyBlockedPageCleanupObserver']){const _0x4ba176=new MutationObserver(_0x156d17);_0x4ba176[_0x34e2b4(0xdd)](document[_0x34e2b4(0x106)],{'childList':!![],'subtree':!![]}),_0xc9c0d0[_0x34e2b4(0x138)]=_0x4ba176;}}function _0xb82f59(){const _0x32c72f=_0x71612f,_0x47e09a=String(location[_0x32c72f(0xfe)]||'')['toLowerCase'](),_0x522f7a=_0x47e09a[_0x32c72f(0x152)](/^([a-z0-9-]+)\.margonem\.pl$/i);if(!_0x522f7a?.[0x1])return![];const _0xa21890=new Set([_0x32c72f(0x15f),_0x32c72f(0x183),_0x32c72f(0x146),_0x32c72f(0x180),_0x32c72f(0x191),_0x32c72f(0x112),'api',_0x32c72f(0x170),_0x32c72f(0xf5),_0x32c72f(0xd5),_0x32c72f(0x192),'payment',_0x32c72f(0x17c),_0x32c72f(0x130),_0x32c72f(0x17f),_0x32c72f(0xd2),_0x32c72f(0x17b),_0x32c72f(0xfa),_0x32c72f(0xe5)]);return!_0xa21890['has'](_0x522f7a[0x1]['toLowerCase']());}if(!_0xb82f59()){_0x654853();return;}let _0x732811='',_0x1f9ac8=![];function _0x3c9bc2(_0x250839){const _0x539201=_0x71612f;try{return String(_0xc9c0d0[_0x539201(0x129)][_0x539201(0x14b)](_0x250839)||'')[_0x539201(0x142)]();}catch(_0x1a3112){return'';}}function _0x409d70(_0x45f8be,_0x59d90f){const _0x45b878=_0x71612f;try{_0x59d90f?_0xc9c0d0[_0x45b878(0x129)]['setItem'](_0x45f8be,String(_0x59d90f)):_0xc9c0d0['localStorage'][_0x45b878(0xcd)](_0x45f8be);}catch(_0x3f7ffa){}}async function _0x2e65e2(){const _0x42463e=_0x71612f,_0x3c004a=_0x3c9bc2(_0x4574fb[_0x42463e(0x13b)]);let _0x5336e5='';try{typeof GM_getValue==='function'&&(_0x5336e5=String(await GM_getValue(_0x4574fb[_0x42463e(0x12e)],'')||'')[_0x42463e(0x142)]());}catch(_0x345360){console[_0x42463e(0x123)](_0x42463e(0x140),_0x345360);}if(_0x5336e5)_0x732811=_0x5336e5,_0x409d70(_0x4574fb[_0x42463e(0x13b)],_0x5336e5);else{if(_0x3c004a){_0x732811=_0x3c004a;try{typeof GM_setValue===_0x42463e(0x15c)&&await GM_setValue(_0x4574fb[_0x42463e(0x12e)],_0x3c004a);}catch(_0x161649){console[_0x42463e(0x123)](_0x42463e(0x18c),_0x161649);}}}let _0x10262e=_0x3c9bc2(_0x4574fb[_0x42463e(0x10d)])==='1';try{if(typeof GM_getValue===_0x42463e(0x15c)){const _0x75c140=Boolean(await GM_getValue(_0x4574fb['joinStepKey'],![]));_0x1f9ac8=_0x75c140||_0x10262e;}else _0x1f9ac8=_0x10262e;}catch(_0x270646){_0x1f9ac8=_0x10262e;}if(_0x1f9ac8)_0x409d70(_0x4574fb[_0x42463e(0x10d)],'1');_0xc9c0d0[_0x42463e(0xf9)]=Boolean(_0x732811);}function _0x1e7825(){const _0x45a8fd=_0x71612f;return _0x3c9bc2(_0x4574fb[_0x45a8fd(0x13b)])||_0x732811;}function _0x3b241a(_0x1f1a4c){const _0xd7f465=_0x71612f,_0x516856=String(_0x1f1a4c||'')[_0xd7f465(0x142)]();_0x732811=_0x516856,_0xc9c0d0[_0xd7f465(0xf9)]=Boolean(_0x516856),_0x409d70(_0x4574fb[_0xd7f465(0x13b)],_0x516856);try{if(_0x516856&&typeof GM_setValue==='function')void GM_setValue(_0x4574fb[_0xd7f465(0x12e)],_0x516856);else!_0x516856&&typeof GM_deleteValue==='function'&&void GM_deleteValue(_0x4574fb[_0xd7f465(0x12e)]);}catch(_0x2a2160){console['warn'](_0xd7f465(0x11f),_0x2a2160);}}function _0x220aa0(_0x22673a){const _0x263a0c=_0x71612f;_0x1f9ac8=Boolean(_0x22673a),_0x409d70(_0x4574fb[_0x263a0c(0x10d)],_0x22673a?'1':'');try{if(_0x22673a&&typeof GM_setValue===_0x263a0c(0x15c))void GM_setValue(_0x4574fb['joinStepKey'],!![]);else!_0x22673a&&typeof GM_deleteValue===_0x263a0c(0x15c)&&void GM_deleteValue(_0x4574fb[_0x263a0c(0x10d)]);}catch(_0x526f0f){}}await _0x2e65e2();function _0x14a65b(){const _0x4d286f=_0x71612f,_0x43e42d=[_0xc9c0d0[_0x4d286f(0x17a)]?.[_0x4d286f(0xd1)]?.['d'],_0xc9c0d0['Engine']?.[_0x4d286f(0xd1)],_0xc9c0d0[_0x4d286f(0xd1)],_0xc9c0d0['g']?.['hero']];return _0x43e42d[_0x4d286f(0x18e)](_0xecc3e6=>{const _0x2a04fa=_0x4d286f;if(!_0xecc3e6||typeof _0xecc3e6!==_0x2a04fa(0x186))return![];const _0x244c85=_0xecc3e6['id']??_0xecc3e6['nick']??_0xecc3e6[_0x2a04fa(0x17f)];return Boolean(_0x244c85)&&Number[_0x2a04fa(0x150)](Number(_0xecc3e6['x']))&&Number[_0x2a04fa(0x150)](Number(_0xecc3e6['y']));});}async function _0x16c550(_0x2c80b6=0xafc8){const _0x5ca2e3=_0x71612f,_0x21486c=Date['now']();while(Date[_0x5ca2e3(0x182)]()-_0x21486c<_0x2c80b6){if(_0x14a65b())return!![];_0x156d17(),await new Promise(_0x10077f=>setTimeout(_0x10077f,0xfa));}return![];}if(_0xc9c0d0[_0x71612f(0x14d)]){if(!_0x14a65b())_0x654853();return;}if(_0xc9c0d0['__garbatySecureLoaderBooting'])return;_0xc9c0d0[_0x71612f(0x13f)]=!![];const _0x3df917=await _0x16c550();_0xc9c0d0[_0x71612f(0x13f)]=![];if(!_0x3df917||_0xc9c0d0['__garbatySecureLoaderStarted']){if(!_0x3df917)_0x654853();return;}_0xc9c0d0['__garbatySecureLoaderStarted']=!![];const _0x1b5429={'loading':![],'loaded':![],'roleRefreshing':![]};function _0x416de4(_0x46e170,_0x3d582f,_0x5b7384=![]){const _0x57f078=_0x71612f,_0x16f112=document[_0x57f078(0xce)](_0x57f078(0x128));return _0x16f112['type']=_0x57f078(0x128),_0x16f112[_0x57f078(0x15a)]=_0x46e170,_0x16f112[_0x57f078(0x16e)][_0x57f078(0xcf)]=[_0x57f078(0xef),_0x57f078(0x124),_0x57f078(0xdc),_0x57f078(0x173)+(_0x5b7384?_0x57f078(0x11d):_0x57f078(0x10f)),_0x57f078(0x133),_0x57f078(0x179)+(_0x5b7384?'#1d1f20':'#29261d'),_0x57f078(0xf6),_0x57f078(0xf3),_0x57f078(0x104)][_0x57f078(0x12b)](';'),_0x16f112[_0x57f078(0x174)]('click',_0x3d582f),_0x16f112;}function _0xb0d020({title:title=_0x71612f(0xed),text:_0x2151f3,buttonText:buttonText='',onClick:onClick=null,secondaryButtonText:secondaryButtonText='',secondaryOnClick:secondaryOnClick=null,error:error=![]}){const _0x2ae4d9=_0x71612f;document['getElementById'](_0x2ae4d9(0x144))?.[_0x2ae4d9(0x12d)]();const _0xf9427b=document['createElement'](_0x2ae4d9(0x145));_0xf9427b['id']='garbaty-secure-loader-message',_0xf9427b['style'][_0x2ae4d9(0xcf)]=[_0x2ae4d9(0x13e),_0x2ae4d9(0xdb),_0x2ae4d9(0x139),_0x2ae4d9(0x149),_0x2ae4d9(0x189),_0x2ae4d9(0xe1),_0x2ae4d9(0x111),_0x2ae4d9(0xcc),_0x2ae4d9(0x196),_0x2ae4d9(0x18d),_0x2ae4d9(0x10c),_0x2ae4d9(0x107),_0x2ae4d9(0x17d),_0x2ae4d9(0x151),_0x2ae4d9(0x141)][_0x2ae4d9(0x12b)](';');const _0x161890=document[_0x2ae4d9(0xce)](_0x2ae4d9(0x145));_0x161890[_0x2ae4d9(0x15a)]=title,_0x161890[_0x2ae4d9(0x16e)][_0x2ae4d9(0xcf)]='font-size:18px;font-weight:700;margin-bottom:9px;color:'+(error?_0x2ae4d9(0x187):_0x2ae4d9(0xd3));const _0xc012a7=document[_0x2ae4d9(0xce)](_0x2ae4d9(0x145));_0xc012a7[_0x2ae4d9(0x15a)]=_0x2151f3,_0xc012a7['style'][_0x2ae4d9(0xcf)]=_0x2ae4d9(0x127);const _0x137d31=document['createElement']('button');_0x137d31[_0x2ae4d9(0x134)]=_0x2ae4d9(0x128),_0x137d31[_0x2ae4d9(0x15a)]='×',_0x137d31[_0x2ae4d9(0x178)](_0x2ae4d9(0x175),_0x2ae4d9(0xe0)),_0x137d31[_0x2ae4d9(0x168)]=_0x2ae4d9(0xe0),_0x137d31[_0x2ae4d9(0x16e)]['cssText']=[_0x2ae4d9(0x15b),'right:8px',_0x2ae4d9(0x171),_0x2ae4d9(0x161),_0x2ae4d9(0x153),_0x2ae4d9(0x165),'border:0',_0x2ae4d9(0x115),'color:#888',_0x2ae4d9(0x118),_0x2ae4d9(0x104)][_0x2ae4d9(0x12b)](';'),_0x137d31[_0x2ae4d9(0x174)](_0x2ae4d9(0x162),()=>{const _0xcb8984=_0x2ae4d9;_0x137d31[_0xcb8984(0x16e)][_0xcb8984(0x14e)]=_0xcb8984(0xe6);}),_0x137d31[_0x2ae4d9(0x174)](_0x2ae4d9(0x16b),()=>{const _0x48758e=_0x2ae4d9;_0x137d31[_0x48758e(0x16e)]['color']=_0x48758e(0xcb);}),_0x137d31[_0x2ae4d9(0x174)]('click',()=>_0xf9427b[_0x2ae4d9(0x12d)]()),_0xf9427b[_0x2ae4d9(0x14a)](_0x137d31,_0x161890,_0xc012a7);if(buttonText&&typeof onClick==='function'){const _0x26517a=document[_0x2ae4d9(0xce)]('div');_0x26517a[_0x2ae4d9(0x16e)][_0x2ae4d9(0xcf)]=_0x2ae4d9(0xf7),_0x26517a[_0x2ae4d9(0x100)](_0x416de4(buttonText,onClick)),_0xf9427b[_0x2ae4d9(0x100)](_0x26517a);}if(secondaryButtonText&&typeof secondaryOnClick===_0x2ae4d9(0x15c)){const _0x45c6d3=document[_0x2ae4d9(0xce)]('div');_0x45c6d3[_0x2ae4d9(0x16e)][_0x2ae4d9(0xcf)]='margin-top:8px',_0x45c6d3[_0x2ae4d9(0x100)](_0x416de4(secondaryButtonText,secondaryOnClick,!![])),_0xf9427b[_0x2ae4d9(0x100)](_0x45c6d3);}return(document['body']||document[_0x2ae4d9(0x106)])['appendChild'](_0xf9427b),_0xf9427b;}function _0x3e4565(_0x4be88a){const _0x524ba2=_0x71612f;if(!_0x4be88a||_0x4be88a[_0x524ba2(0x176)](_0x524ba2(0xe3)))return;const _0x560f20=document[_0x524ba2(0xce)](_0x524ba2(0x145));_0x560f20['id']=_0x524ba2(0xd8),_0x560f20[_0x524ba2(0x16e)][_0x524ba2(0xcf)]=_0x524ba2(0x14f);const _0x4cb56e=document['createElement'](_0x524ba2(0x145));_0x4cb56e[_0x524ba2(0x15a)]=_0x524ba2(0xfc),_0x4cb56e[_0x524ba2(0x16e)][_0x524ba2(0xcf)]=_0x524ba2(0x105),_0x560f20['append'](_0x4cb56e,_0x416de4(_0x524ba2(0x10b),_0x25317a,!![])),_0x4be88a[_0x524ba2(0x100)](_0x560f20);}function _0x214614(_0x5799bf){_0x220aa0(!![]),_0x3e4565(_0x5799bf);}function _0x574f9f(_0x4e0cfc){const _0x56b478=_0x71612f;_0x214614(_0x4e0cfc);const _0x596a64=_0xc9c0d0[_0x56b478(0x13d)](_0x4574fb[_0x56b478(0x190)],'_blank');try{if(_0x596a64)_0x596a64[_0x56b478(0x195)]=null;}catch(_0xc886b4){}if(!_0x596a64&&!_0x4e0cfc[_0x56b478(0x176)]('.garbaty-discord-popup-warning')){const _0x355072=document[_0x56b478(0xce)](_0x56b478(0x145));_0x355072[_0x56b478(0x119)]='garbaty-discord-popup-warning',_0x355072['textContent']=_0x56b478(0x163),_0x355072['style'][_0x56b478(0xcf)]=_0x56b478(0x158),_0x4e0cfc[_0x56b478(0x176)](_0x56b478(0xee))?.[_0x56b478(0x100)](_0x355072);}}function _0x5ad35a(_0x10e1fc,{forceJoinStep:forceJoinStep=![]}={}){const _0x600e2a=_0x71612f;if(forceJoinStep)_0x220aa0(![]);const _0x3977f8=_0xb0d020({'title':_0x600e2a(0x136),'text':_0x10e1fc}),_0x33ff10=document[_0x600e2a(0xce)]('div');_0x33ff10['id']=_0x600e2a(0xf1),_0x33ff10['style'][_0x600e2a(0xcf)]=_0x600e2a(0xf7);const _0x1bdd99=_0x416de4(_0x600e2a(0xf4),()=>{_0x574f9f(_0x3977f8);}),_0x4dbd8b=document[_0x600e2a(0xce)](_0x600e2a(0x145));_0x4dbd8b[_0x600e2a(0x15a)]=_0x600e2a(0x13c),_0x4dbd8b['style'][_0x600e2a(0xcf)]=_0x600e2a(0x114);const _0x3cf582=document[_0x600e2a(0xce)]('a');_0x3cf582['href']=_0x4574fb[_0x600e2a(0x190)],_0x3cf582['target']=_0x600e2a(0x159),_0x3cf582[_0x600e2a(0x116)]=_0x600e2a(0xeb),_0x3cf582[_0x600e2a(0x15a)]=_0x4574fb[_0x600e2a(0x190)],_0x3cf582[_0x600e2a(0x16e)][_0x600e2a(0xcf)]=_0x600e2a(0x135),_0x3cf582['addEventListener'](_0x600e2a(0x120),()=>_0x214614(_0x3977f8)),_0x33ff10[_0x600e2a(0x14a)](_0x1bdd99,_0x4dbd8b,_0x3cf582),_0x3977f8[_0x600e2a(0x100)](_0x33ff10);if(_0x1f9ac8)_0x3e4565(_0x3977f8);}function _0x25317a(){const _0x19e9dd=_0x71612f;if(!_0x1f9ac8){_0x5ad35a(_0x19e9dd(0xff),{'forceJoinStep':!![]});return;}const _0x5a8ad9=''+_0x4574fb[_0x19e9dd(0x131)]+_0x4574fb[_0x19e9dd(0xe4)]+(_0x19e9dd(0x193)+encodeURIComponent(location['origin'])),_0x34ff4c=0x208,_0x2ba144=0x2d0,_0x5a4253=Math[_0x19e9dd(0x194)](0x0,Math[_0x19e9dd(0x16a)](screenX+(outerWidth-_0x34ff4c)/0x2)),_0xfe855c=Math[_0x19e9dd(0x194)](0x0,Math[_0x19e9dd(0x16a)](screenY+(outerHeight-_0x2ba144)/0x2)),_0x446283=_0xc9c0d0['open'](_0x5a8ad9,_0x19e9dd(0x16d),_0x19e9dd(0x169)+_0x34ff4c+_0x19e9dd(0x147)+_0x2ba144+',left='+_0x5a4253+_0x19e9dd(0x167)+_0xfe855c);!_0x446283&&_0xb0d020({'title':_0x19e9dd(0xd9),'text':'Zezwól\x20tej\x20stronie\x20na\x20wyskakujące\x20okna\x20i\x20spróbuj\x20ponownie.','buttonText':_0x19e9dd(0x10b),'onClick':_0x25317a,'error':!![]});}function _0x532c88(){const _0x4e0f1a=_0x71612f;_0xb0d020({'title':_0x4e0f1a(0x14c),'text':_0x4e0f1a(0xec),'buttonText':_0x4e0f1a(0x137),'onClick':_0x3caac3,'secondaryButtonText':'ZALOGUJ\x20/\x20ZMIEŃ\x20KONTO','secondaryOnClick':_0x25317a,'error':!![]});}async function _0x29fbcd(){const _0x57d2c4=_0x71612f;if(_0x1b5429['loading']||_0x1b5429[_0x57d2c4(0xe8)])return;const _0x210cb2=_0x1e7825();if(!_0x210cb2){_0x5ad35a(_0x57d2c4(0xde));return;}_0x1b5429['loading']=!![];try{const _0x11c973=await _0xc9c0d0[_0x57d2c4(0xd7)](''+_0x4574fb[_0x57d2c4(0x131)]+_0x4574fb[_0x57d2c4(0x143)],{'method':_0x57d2c4(0x117),'headers':{'Accept':_0x57d2c4(0x18f),'Authorization':_0x57d2c4(0xf2)+_0x210cb2},'cache':_0x57d2c4(0xd0)});if(_0x11c973[_0x57d2c4(0x18a)]===0x191){_0x220aa0(!![]),_0x3b241a(''),_0x5ad35a(_0x57d2c4(0x12f));return;}if(_0x11c973[_0x57d2c4(0x18a)]===0x193){_0x532c88();return;}if(!_0x11c973['ok'])throw new Error(_0x57d2c4(0x164)+_0x11c973[_0x57d2c4(0x18a)]);const _0x55a675=await _0x11c973[_0x57d2c4(0x102)]();if(!_0x55a675['trim']())throw new Error(_0x57d2c4(0x12c));document[_0x57d2c4(0x13a)](_0x57d2c4(0x144))?.[_0x57d2c4(0x12d)]();const _0x2da677=_0xc9c0d0[_0x57d2c4(0x197)](_0x55a675+_0x57d2c4(0xfd));_0x2da677[_0x57d2c4(0x11a)](_0xc9c0d0),_0x1b5429['loaded']=!![],console[_0x57d2c4(0xea)](_0x57d2c4(0xd4));}catch(_0x4c874b){console[_0x57d2c4(0x109)]('[Garbaty\x20Panel\x20Loader]',_0x4c874b),_0xb0d020({'title':'Nie\x20udało\x20się\x20uruchomić\x20panelu','text':'Serwer\x20może\x20się\x20właśnie\x20uruchamiać.\x20Spróbuj\x20ponownie\x20za\x20chwilę.','buttonText':_0x57d2c4(0xdf),'onClick':_0x29fbcd,'error':!![]});}finally{_0x1b5429[_0x57d2c4(0x110)]=![];}}async function _0x3caac3(){const _0x5c0760=_0x71612f;if(_0x1b5429[_0x5c0760(0x188)])return;const _0x4a9ff2=_0x1e7825();if(!_0x4a9ff2){_0x5ad35a(_0x5c0760(0x172));return;}_0x1b5429[_0x5c0760(0x188)]=!![],_0xb0d020({'title':'Sprawdzanie\x20roli','text':'Pobieram\x20aktualne\x20role\x20bezpośrednio\x20z\x20Discorda...'});try{const _0x39b5e3=await _0xc9c0d0[_0x5c0760(0xd7)](''+_0x4574fb[_0x5c0760(0x131)]+_0x4574fb[_0x5c0760(0xda)],{'method':'POST','headers':{'Accept':_0x5c0760(0x18b),'Content-Type':'application/json','Authorization':'Bearer\x20'+_0x4a9ff2},'body':'{}','cache':_0x5c0760(0x11e)}),_0x41c7a8=await _0x39b5e3['json']()[_0x5c0760(0x15e)](()=>({}));if(_0x39b5e3[_0x5c0760(0x18a)]===0x191){_0x220aa0(!![]),_0x3b241a(''),_0x5ad35a(_0x5c0760(0x12f));return;}if(!_0x39b5e3['ok'])throw new Error(_0x5c0760(0x101)+_0x39b5e3[_0x5c0760(0x18a)]);if(_0x41c7a8[_0x5c0760(0x122)]===!![]||_0x41c7a8[_0x5c0760(0xfb)]===!![]){await _0x29fbcd();return;}if(_0x41c7a8[_0x5c0760(0x10e)]==='not_in_guild'){_0x5ad35a(_0x5c0760(0x155),{'forceJoinStep':!![]});return;}_0x532c88();}catch(_0x103f2b){console[_0x5c0760(0x109)](_0x5c0760(0x11b),_0x103f2b),_0xb0d020({'title':_0x5c0760(0x16c),'text':'Serwer\x20Discord\x20lub\x20backend\x20może\x20być\x20chwilowo\x20niedostępny.','buttonText':_0x5c0760(0x137),'onClick':_0x3caac3,'secondaryButtonText':_0x5c0760(0xca),'secondaryOnClick':_0x25317a,'error':!![]});}finally{_0x1b5429[_0x5c0760(0x188)]=![];}}_0xc9c0d0['addEventListener']('message',_0x11b434=>{const _0x95a9a0=_0x71612f,_0x387266=_0x11b434['data'];if(_0x11b434['origin']===location[_0x95a9a0(0x125)]){if(_0x387266?.['type']===_0x95a9a0(0x154)&&_0x387266[_0x95a9a0(0x17e)]){_0x3b241a(_0x387266['token']);return;}if(_0x387266?.[_0x95a9a0(0x134)]===_0x95a9a0(0x166)){_0x3b241a('');return;}}if(_0x11b434['origin']!==new URL(_0x4574fb['baseUrl'])['origin'])return;if(!_0x387266||_0x387266[_0x95a9a0(0x134)]!==_0x4574fb[_0x95a9a0(0x126)])return;if(_0x387266['ok']===!![]&&_0x387266[_0x95a9a0(0x17e)]){_0x220aa0(!![]),_0x3b241a(_0x387266[_0x95a9a0(0x17e)]),void _0x29fbcd();return;}const _0x148619=String(_0x387266[_0x95a9a0(0x10e)]||_0x387266[_0x95a9a0(0x109)]||'');if(_0x148619==='not_in_guild'){_0x5ad35a(_0x95a9a0(0x121),{'forceJoinStep':!![]});return;}if(_0x387266[_0x95a9a0(0x109)]===_0x95a9a0(0xf8)){_0xb0d020({'title':_0x95a9a0(0x14c),'text':_0x95a9a0(0xd6),'buttonText':_0x95a9a0(0x11c),'onClick':_0x25317a,'error':!![]});return;}_0xb0d020({'title':_0x95a9a0(0xe2),'text':_0x95a9a0(0x160),'buttonText':'SPRÓBUJ\x20PONOWNIE','onClick':_0x25317a,'error':!![]});}),await _0x29fbcd();}()));function _0x2f2f(){const _0x2eda76=['border-radius:7px','some','application/javascript','discordInviteUrl','addons','dev','?origin=','max','opener','border:1px\x20solid\x20#3b3525','Function','ZALOGUJ\x20INNE\x20KONTO','#888','padding:22px','removeItem','createElement','cssText','default','hero','static','#d5b764','[Garbaty\x20Panel]\x20Chroniony\x20panel\x20został\x20uruchomiony.','pomoc','Logowanie\x20zakończyło\x20się\x20poprawnie,\x20ale\x20konto\x20nie\x20ma\x20roli\x20Podstawowy\x20ani\x20Premium.','fetch','garbaty-discord-login-step','Okno\x20zostało\x20zablokowane','roleRefreshPath','left:50%','padding:10px\x2012px','observe','Najpierw\x20dołącz\x20do\x20serwera\x20Garbatego\x20Panelu,\x20a\x20następnie\x20zaloguj\x20się\x20przez\x20Discord.','SPRÓBUJ\x20PONOWNIE','Zamknij','width:min(420px,calc(100vw\x20-\x2032px))','Logowanie\x20nie\x20powiodło\x20się','#garbaty-discord-login-step','loginPath','help','#bbb','/api/panel','loaded','head','log','noopener\x20noreferrer','Zapisana\x20sesja\x20nie\x20ma\x20roli\x20Podstawowy\x20ani\x20Premium.\x20Jeśli\x20rola\x20została\x20właśnie\x20nadana,\x20sprawdź\x20ją\x20ponownie.','Garbaty\x20Panel','#garbaty-discord-join-step','display:block','https://discord.gg/MdXVJFmgDf','garbaty-discord-join-step','Bearer\x20','font-weight:700','DOŁĄCZ\x20DO\x20SERWERA\x20DISCORD','support','color:#eee','margin-top:18px','missing_access','__garbatySharedSessionLoaded','shop','premium','Po\x20dołączeniu\x20do\x20serwera\x20zaloguj\x20się\x20swoim\x20kontem\x20Discord.','\x0a//#\x20sourceURL=garbaty-protected-panel-v6.10.2.js','hostname','Przed\x20logowaniem\x20najpierw\x20otwórz\x20link\x20i\x20dołącz\x20do\x20serwera\x20Discord.','appendChild','role_refresh_http_','text','garbaty_discord_panel_token_shared_v1','cursor:pointer','margin-bottom:11px;color:#aeb0b2;font-size:12px;line-height:1.45','documentElement','color:#ddd','6316320HTIdOp','error','1873080zAdyEW','ZALOGUJ\x20PRZEZ\x20DISCORD','background:#131516','joinStepKey','reason','#715b26','loading','box-sizing:border-box','addons2','GARBATY_DISCORD_AUTH_RESULT','margin-top:11px;color:#85888a;font-size:11px','background:transparent','rel','GET','font:22px/28px\x20Arial,sans-serif','className','call','[Garbaty\x20Panel\x20Role\x20Refresh]','ZALOGUJ\x20/\x20ZMIEŃ\x20KONTO','#4a4a4a','no-store','[Garbaty\x20Panel]\x20Nie\x20udało\x20się\x20zaktualizować\x20wspólnej\x20sesji:','click','To\x20konto\x20nie\x20znajduje\x20się\x20jeszcze\x20na\x20serwerze.\x20Najpierw\x20dołącz\x20przez\x20poniższy\x20link.','basic','warn','width:100%','origin','messageType','line-height:1.5;color:#aaa','button','localStorage','garbaty_discord_panel_token','join','empty_panel','remove','sharedTokenKey','Sesja\x20jest\x20nieważna.\x20Zaloguj\x20się\x20ponownie\x20przez\x20Discord.','konto','baseUrl','207906EXVlUd','border-radius:4px','type','display:inline-block;margin-top:4px;color:#6f9fe8;font-size:12px;text-decoration:underline;overflow-wrap:anywhere','Autoryzacja\x20Discord','SPRAWDŹ\x20ROLĘ\x20TERAZ','__garbatyBlockedPageCleanupObserver','top:50%','getElementById','tokenKey','Link\x20do\x20serwera:','open','position:fixed','__garbatySecureLoaderBooting','[Garbaty\x20Panel]\x20Nie\x20udało\x20się\x20odczytać\x20wspólnej\x20sesji:','box-shadow:0\x2012px\x2035px\x20rgba(0,0,0,.65)','trim','panelPath','garbaty-secure-loader-message','div','forum',',height=','__garbatySecureLoaderVersion','transform:translate(-50%,-50%)','append','getItem','Brak\x20wymaganej\x20roli','__garbatySecureLoaderStarted','color','margin-top:18px;padding-top:16px;border-top:1px\x20solid\x20#343638','isFinite','text-align:center','match','height:28px','GARBATY_PANEL_SYNC_SHARED_TOKEN','To\x20konto\x20nie\x20znajduje\x20się\x20na\x20serwerze.\x20Najpierw\x20dołącz\x20przez\x20poniższy\x20link.','1089152wZJHJj','8083747xlloEu','margin-top:9px;color:#d8a95c;font-size:11px;line-height:1.4','_blank','textContent','position:absolute','function','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20#garbaty-secure-loader-message,\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20#garbaty-manual-update-prompt\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20none\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20visibility:\x20hidden\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20pointer-events:\x20none\x20!important;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','catch','www','Nie\x20udało\x20się\x20potwierdzić\x20dostępu\x20przez\x20Discord.','width:28px','mouseenter','Jeśli\x20Discord\x20się\x20nie\x20otworzył,\x20kliknij\x20widoczny\x20link\x20zaproszenia.','panel_http_','padding:0','GARBATY_PANEL_CLEAR_SHARED_TOKEN',',top=','title','popup=yes,width=','round','mouseleave','Nie\x20udało\x20się\x20sprawdzić\x20roli','garbaty-discord-login','style','/auth/discord/start','cdn','top:5px','Najpierw\x20zaloguj\x20się\x20przez\x20Discord.','border:1px\x20solid\x20','addEventListener','aria-label','querySelector','235MZcDHZ','setAttribute','background:','Engine','beta','payments','font:14px\x20Arial,sans-serif','token','account','blog','1240544gPhLBA','now','new','1185420qLRaue','garbaty-manual-update-prompt','object','#dc7777','roleRefreshing','z-index:2147483647','status','application/json','[Garbaty\x20Panel]\x20Nie\x20udało\x20się\x20zapisać\x20wspólnej\x20sesji:'];_0x2f2f=function(){return _0x2eda76;};return _0x2f2f();}
