// ==UserScript==
// @name         Jira Background remover 3000
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       msamson
// @match        https://omnimedjira.atlassian.net/jira/software/c/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

  const style = document.createElement('style');
  style.textContent = `
    :root {
      --project-elevation-surface: transparent !important;
    }
  `;
  document.head.appendChild(style);
})();