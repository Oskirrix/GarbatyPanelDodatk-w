from pathlib import Path

path = Path('Garbaty Panel.user.js')
s = path.read_text(encoding='utf-8')

if 'GARBATY_FORCE_UPDATE_V1' in s:
    raise SystemExit('forced update helper already installed')

s = s.replace('// @version      6.10.3', '// @version      6.10.4', 1)
s = s.replace("_0x414d65='6.10.3'", "_0x414d65='6.10.4'", 1)

helper = r'''
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
'''.strip() + '\n\n'

anchor = 'function _0x3a87'
if anchor not in s:
    raise SystemExit('loader function anchor not found')
s = s.replace(anchor, helper + anchor, 1)

old_start = "(async function(){'use strict';const _0x71612f=_0x3a87;"
new_start = "(async function(){'use strict';if(await __garbatyCheckRequiredVersion())return;const _0x71612f=_0x3a87;"
if old_start not in s:
    raise SystemExit('main loader async anchor not found')
s = s.replace(old_start, new_start, 1)

if '// @version      6.10.4' not in s:
    raise SystemExit('metadata version was not updated')
if "_0x414d65='6.10.4'" not in s:
    raise SystemExit('runtime version was not updated')
if 'AKTUALIZUJ PANEL' not in s:
    raise SystemExit('update button missing')

path.write_text(s, encoding='utf-8')
