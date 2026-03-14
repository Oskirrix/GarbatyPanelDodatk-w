// ==UserScript==
// @name         Garbaty Panel Dodatków
// @version      5.6
// @description  Panel dodatków na Sigma Interfejs
// @author       Kuchar
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @exclude      http*://margonem.*/*
// @exclude      http*://www.margonem.*/*
// @exclude      http*://new.margonem.*/*
// @exclude      http*://forum.margonem.*/*
// @exclude      http*://commons.margonem.*/*
// @exclude      http*://dev-commons.margonem.*/*
// @exclude      http*://public-api.margonem.*/*
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
