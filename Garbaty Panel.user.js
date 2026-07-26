// ==UserScript==
// @name         Garbaty Panel Dodatków
// @version      6.9
// @description  Bezpieczny loader Garbatego Panelu
// @author       Kuchar
// @match        https://*.margonem.pl/*
// @exclude      https://margonem.pl/
// @grant        none
// @icon         https://cdn-icons-png.freepik.com/512/4594/4594548.png
// @updateURL    https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js
// @downloadURL  https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js
// ==/UserScript==

(async function () {
    'use strict';

    const CONFIG = Object.freeze({
        baseUrl: 'https://garbaty-panel-api.onrender.com',
        panelPath: '/api/panel',
        loginPath: '/auth/discord/start',
        tokenKey: 'garbaty_discord_panel_token',
        messageType: 'GARBATY_DISCORD_AUTH_RESULT'
    });

    if (window.__garbatySecureLoaderStarted) return;
    window.__garbatySecureLoaderStarted = true;

    const state = {
        loading: false,
        loaded: false
    };

    function getToken() {
        try {
            return String(localStorage.getItem(CONFIG.tokenKey) || '').trim();
        } catch (_) {
            return '';
        }
    }

    function setToken(token) {
        try {
            if (token) {
                localStorage.setItem(CONFIG.tokenKey, String(token));
            } else {
                localStorage.removeItem(CONFIG.tokenKey);
            }
        } catch (_) {}
    }

    function removeMessage() {
        document.getElementById('garbaty-secure-loader-message')?.remove();
    }

    function showMessage({
        title = 'Garbaty Panel',
        text,
        buttonText = '',
        onClick = null,
        error = false
    }) {
        removeMessage();

        const box = document.createElement('div');
        box.id = 'garbaty-secure-loader-message';
        box.style.cssText = [
            'position:fixed',
            'left:50%',
            'top:50%',
            'transform:translate(-50%,-50%)',
            'z-index:2147483647',
            'width:min(420px,calc(100vw - 32px))',
            'box-sizing:border-box',
            'padding:22px',
            'border:1px solid #3b3525',
            'border-radius:7px',
            'background:#131516',
            'color:#ddd',
            'font:14px Arial,sans-serif',
            'text-align:center',
            'box-shadow:0 12px 35px rgba(0,0,0,.65)'
        ].join(';');

        const safeTitle = document.createElement('div');
        safeTitle.textContent = title;
        safeTitle.style.cssText =
            `font-size:18px;font-weight:700;margin-bottom:9px;color:${error ? '#dc7777' : '#d5b764'}`;

        const safeText = document.createElement('div');
        safeText.textContent = text;
        safeText.style.cssText = 'line-height:1.5;color:#aaa';

        box.append(safeTitle, safeText);

        if (buttonText && typeof onClick === 'function') {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = buttonText;
            button.style.cssText = [
                'display:block',
                'width:100%',
                'margin-top:18px',
                'padding:10px 12px',
                'border:1px solid #715b26',
                'border-radius:4px',
                'background:#29261d',
                'color:#eee',
                'font-weight:700',
                'cursor:pointer'
            ].join(';');
            button.addEventListener('click', onClick);
            box.appendChild(button);
        }

        (document.body || document.documentElement).appendChild(box);
    }

    async function loadProtectedPanel() {
        if (state.loading || state.loaded) return;

        const token = getToken();
        if (!token) {
            showLogin('Zaloguj się przez Discord, aby pobrać Garbaty Panel.');
            return;
        }

        state.loading = true;

        try {
            const response = await fetch(`${CONFIG.baseUrl}${CONFIG.panelPath}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/javascript',
                    Authorization: `Bearer ${token}`
                },
                cache: 'no-store'
            });

            if (response.status === 401) {
                setToken('');
                showLogin('Sesja jest nieważna. Zaloguj się ponownie przez Discord.');
                return;
            }

            if (response.status === 403) {
                showMessage({
                    title: 'Brak dostępu',
                    text: 'Konto nie ma wymaganej roli Podstawowy ani Premium.',
                    error: true
                });
                return;
            }

            if (!response.ok) {
                throw new Error(`panel_http_${response.status}`);
            }

            const panelCode = await response.text();
            if (!panelCode.trim()) {
                throw new Error('empty_panel');
            }

            removeMessage();
            (0, eval)(`${panelCode}\n//# sourceURL=garbaty-protected-panel-v6.9.js`);
            state.loaded = true;
            console.log('[Garbaty Panel] Chroniony panel został uruchomiony.');
        } catch (error) {
            console.error('[Garbaty Panel Loader]', error);
            showMessage({
                title: 'Nie udało się uruchomić panelu',
                text: 'Serwer może się właśnie uruchamiać. Spróbuj ponownie za chwilę.',
                buttonText: 'SPRÓBUJ PONOWNIE',
                onClick: loadProtectedPanel,
                error: true
            });
        } finally {
            state.loading = false;
        }
    }

    function startDiscordLogin() {
        const loginUrl =
            `${CONFIG.baseUrl}${CONFIG.loginPath}` +
            `?origin=${encodeURIComponent(location.origin)}`;

        const width = 520;
        const height = 720;
        const left = Math.max(0, Math.round(screenX + (outerWidth - width) / 2));
        const top = Math.max(0, Math.round(screenY + (outerHeight - height) / 2));

        const popup = window.open(
            loginUrl,
            'garbaty-discord-login',
            `popup=yes,width=${width},height=${height},left=${left},top=${top}`
        );

        if (!popup) {
            showMessage({
                title: 'Okno zostało zablokowane',
                text: 'Zezwól tej stronie na wyskakujące okna i spróbuj ponownie.',
                buttonText: 'ZALOGUJ PRZEZ DISCORD',
                onClick: startDiscordLogin,
                error: true
            });
        }
    }

    function showLogin(text) {
        showMessage({
            title: 'Autoryzacja Discord',
            text,
            buttonText: 'ZALOGUJ PRZEZ DISCORD',
            onClick: startDiscordLogin
        });
    }

    window.addEventListener('message', event => {
        if (event.origin !== new URL(CONFIG.baseUrl).origin) return;

        const payload = event.data;
        if (!payload || payload.type !== CONFIG.messageType) return;

        if (payload.ok === true && payload.token) {
            setToken(payload.token);
            loadProtectedPanel();
            return;
        }

        showMessage({
            title: 'Logowanie nie powiodło się',
            text: payload.error === 'missing_access'
                ? 'Konto nie ma roli Podstawowy ani Premium.'
                : 'Nie udało się potwierdzić dostępu przez Discord.',
            buttonText: 'SPRÓBUJ PONOWNIE',
            onClick: startDiscordLogin,
            error: true
        });
    });

    await loadProtectedPanel();
})();
