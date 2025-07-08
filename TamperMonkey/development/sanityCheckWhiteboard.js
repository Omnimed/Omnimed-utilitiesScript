// ==UserScript==
// @name         Sanity check whitboard - Jira
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  try to take over the world!
// @author       marobert
// @match        https://omnimedjira.atlassian.net/*/whiteboard/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Attendre que le DOM soit prêt
  window.addEventListener('load', () => {
    // Création du bouton
    const btn = document.createElement('button');
    btn.textContent = '📋 Extraire tickets JQL';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '100px';
    btn.style.left = 'auto';
    btn.style.padding = '10px 15px';
    btn.style.backgroundColor = '#0052cc';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '9999';

    btn.addEventListener('click', () => {
      const iframe = document.querySelector('iframe[title="whiteboard-frame"]');
      if (!iframe) {
        alert('❌ Iframe non trouvée');
        return;
      }

      const content = iframe.contentDocument || iframe.contentWindow.document;
      if (!content) {
        alert('⚠️ L’iframe n’est pas accessible (cross-origin ou non chargée)');
        return;
      }

      const tickets = [...content.querySelectorAll('a[href*="browse/DEV-"]')]
        .map(a => a.textContent.match(/DEV-\d{4,}/)?.[0])
        .filter((v, i, a) => v && a.indexOf(v) === i);

      if (tickets.length === 0) {
        alert('⚠️ Aucun ticket DEV-xxxxx trouvé.');
        return;
      }

      const parentId = prompt('🔢 Entrez le parentId (ex: DEV-12345)') || 'DEV-XXXX';
      const list = tickets.join(', ');

      const jql1 = `parent in (${parentId}) AND id NOT IN (${list}) AND statusCategory != Done`;
      const jql2 = `parent NOT IN (${parentId}) AND id IN (${list}) AND statusCategory != Done`;

      console.log('✅ Requêtes JQL :\n');
      console.log('▶️ Tickets dans l\'épique, mais pas dans le board :\n' + jql1 + '\n');
      console.log('▶️ Tickets le board, mais pas dans l\'épique:\n' + jql2);

      alert('✅ Requêtes JQL affichées dans la console (F12)');
    });

    // Ajout au DOM
    if (window.location.href.endsWith('visualRefresh=true')) {
        console.log('⏩ Script ignoré (visualRefresh=true détecté)');
    } else {
        document.body.appendChild(btn);
    }
  });
})();
