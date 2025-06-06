// ==UserScript==
// @name         Garbaty Panel Dodatków
// @version      5.5
// @description  Panel dodatków na Sigma Interfejs
// @author       Kuchar
// @match        https://*.margonem.pl/*
// @exclude      https://margonem.pl/
// @grant        none
// @icon         https://cdn-icons-png.freepik.com/512/4594/4594548.png
// @updateURL    https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js
// @downloadURL  https://github.com/Oskirrix/GarbatyPanelDodatk-w/raw/refs/heads/main/Garbaty%20Panel.user.js

// ==/UserScript==

(function() {
    const version = Date.now();
    const build = "https://addons2.margonem.pl/get/153/153636dev.js";
    const script = document.createElement("script");
    script.src = `${build}?v=${version}`;
    document.body.appendChild(script);
})();
