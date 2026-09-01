const fs = require('fs');
const cp = require('child_process');
const JavaScriptObfuscator = require('javascript-obfuscator');

const FILE = 'Garbaty Panel.user.js';
const VERSION_FILE = 'loader-version.json';
const BASE_COMMIT = 'c3d597c8f8e8831d58b81bb4bc95d90ac8cc6558';
const OLD_VERSION = '6.10.4';
const NEXT_VERSION = '6.10.6';

let source = cp.execFileSync('git', ['show', `${BASE_COMMIT}:${FILE}`], { encoding: 'utf8' });
const marker = '// ==/UserScript==';
const markerIndex = source.indexOf(marker);
if (markerIndex === -1) throw new Error('Userscript header not found');

let header = source.slice(0, markerIndex + marker.length);
let body = source.slice(markerIndex + marker.length).replace(/^\s+/, '');

header = header.replace(/(^\/\/\s*@version\s+).+$/m, `$1${NEXT_VERSION}`);
body = body.replaceAll(OLD_VERSION, NEXT_VERSION);

const cachePrelude = String.raw`
/* GARBATY_PANEL_BOOT_CACHE_V1 */
(() => {
  'use strict';

  const CACHE_KEY = 'garbaty_panel_boot_cache_v1';
  const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const STALE_FALLBACK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  const RETRY_DELAYS_MS = [0, 1200, 2600, 5200];
  const TARGET_ORIGIN = 'https://garbaty-panel-api-rw39.onrender.com';
  const TARGET_PATH = '/api/panel';

  const root = typeof globalThis !== 'undefined' ? globalThis : window;
  const originalFetch = root.fetch?.bind(root);
  if (typeof originalFetch !== 'function' || root.__garbatyPanelBootCacheV1) return;
  root.__garbatyPanelBootCacheV1 = true;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  function toUrl(input) {
    try {
      if (typeof input === 'string') return new URL(input, location.href);
      if (input instanceof URL) return input;
      if (input && typeof input.url === 'string') return new URL(input.url, location.href);
    } catch (_) {}
    return null;
  }

  function isPanelRequest(input) {
    const url = toUrl(input);
    return Boolean(url && url.origin === TARGET_ORIGIN && url.pathname === TARGET_PATH);
  }

  function readHeader(input, init, name) {
    const wanted = String(name || '').toLowerCase();
    try {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      return String(headers.get(wanted) || '');
    } catch (_) {
      try {
        const raw = init?.headers;
        if (raw && typeof raw === 'object') {
          for (const [key, value] of Object.entries(raw)) {
            if (String(key).toLowerCase() === wanted) return String(value || '');
          }
        }
      } catch (_) {}
    }
    return '';
  }

  function tokenSignature(input, init) {
    const raw = [
      readHeader(input, init, 'authorization'),
      readHeader(input, init, 'x-panel-token'),
      readHeader(input, init, 'x-premium-token')
    ].join('|');

    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      hash ^= raw.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  async function readCache() {
    try {
      if (typeof GM_getValue === 'function') {
        const value = await GM_getValue(CACHE_KEY, null);
        if (value && typeof value === 'object') return value;
        if (typeof value === 'string' && value) return JSON.parse(value);
      }
    } catch (_) {}

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function writeCache(entry) {
    try {
      if (typeof GM_setValue === 'function') await GM_setValue(CACHE_KEY, entry);
    } catch (_) {}
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch (_) {}
  }

  async function clearCache() {
    try {
      if (typeof GM_deleteValue === 'function') await GM_deleteValue(CACHE_KEY);
    } catch (_) {}
    try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
  }

  function cacheUsable(cache, signature, maxAge) {
    return Boolean(
      cache &&
      typeof cache.text === 'string' &&
      cache.text.length > 1000 &&
      cache.signature === signature &&
      Number.isFinite(Number(cache.savedAt)) &&
      Date.now() - Number(cache.savedAt) <= maxAge
    );
  }

  function responseFromCache(cache) {
    return new Response(cache.text, {
      status: 200,
      statusText: 'OK (Garbaty local cache)',
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'X-Garbaty-Panel-Cache': 'HIT'
      }
    });
  }

  async function saveSuccessfulResponse(response, signature) {
    if (!response?.ok) return response;
    const copy = response.clone();
    const text = await copy.text();
    if (text.length <= 1000) return response;

    await writeCache({
      text,
      signature,
      savedAt: Date.now()
    });
    return response;
  }

  async function networkWithRetry(input, init, signature) {
    let lastResponse = null;
    let lastError = null;

    for (let i = 0; i < RETRY_DELAYS_MS.length; i += 1) {
      const wait = RETRY_DELAYS_MS[i];
      if (wait) await delay(wait);

      try {
        const response = await originalFetch(input, init);
        lastResponse = response;

        if (response.status === 401 || response.status === 403) {
          await clearCache();
          return response;
        }

        if (response.ok) {
          await saveSuccessfulResponse(response, signature);
          return response;
        }

        if (![429, 500, 502, 503, 504].includes(response.status)) return response;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error('Garbaty panel backend unavailable');
  }

  function refreshInBackground(input, init, signature) {
    void networkWithRetry(input, init, signature).catch(() => {});
  }

  root.fetch = async function garbatyCachedPanelFetch(input, init) {
    if (!isPanelRequest(input)) return originalFetch(input, init);

    const signature = tokenSignature(input, init);
    const cache = await readCache();

    if (cacheUsable(cache, signature, CACHE_MAX_AGE_MS)) {
      refreshInBackground(input, init, signature);
      return responseFromCache(cache);
    }

    try {
      return await networkWithRetry(input, init, signature);
    } catch (error) {
      if (cacheUsable(cache, signature, STALE_FALLBACK_MAX_AGE_MS)) {
        console.warn('[Garbaty Loader] Backend niedostępny — uruchamiam panel z lokalnego cache.');
        return responseFromCache(cache);
      }
      throw error;
    }
  };
})();
/* /GARBATY_PANEL_BOOT_CACHE_V1 */
`;

body = `${cachePrelude}\n${body}`;

const wrappedBody = `(function(){\n${body}\n})();`;
const obfuscated = JavaScriptObfuscator.obfuscate(wrappedBody, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: true,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 7,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}).getObfuscatedCode();

fs.writeFileSync(FILE, `${header}\n\n${obfuscated}\n`, 'utf8');

const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
versionData.requiredVersion = NEXT_VERSION;
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n', 'utf8');

console.log(`Built loader ${NEXT_VERSION} with panel boot cache`);
