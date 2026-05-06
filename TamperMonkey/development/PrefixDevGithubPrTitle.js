// ==UserScript==
// @name         Auto-prefix DEV tickets in GitHub PR title
// @namespace    https://github.com/
// @version      3.0
// @description  Préfixe le titre de la PR sur /compare/ avec les DEV-XXX trouvés dans les commits. Invariant : tant que tous les tickets ne sont pas présents dans le titre, on (re-)préfixe.
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function isComparePage() {
        return /\/compare\//.test(location.href);
    }

    function extractTickets(text) {
        return [...new Set((text || '').match(/DEV-\d+/gi) || [])].map(t => t.toUpperCase());
    }

    function findTitleInput() {
        return document.querySelector('#pull_request_title')
            || document.querySelector('input[name="pull_request[title]"]')
            || document.querySelector('textarea[name="pull_request[title]"]')
            || document.querySelector('input[aria-label="Title"]')
            || document.querySelector('textarea[aria-label="Title"]');
    }

    function ensurePrefixed() {
        if (!isComparePage()) return;

        const input = findTitleInput();
        if (!input) return;

        const bucket = document.querySelector('#commits_bucket');
        const tickets = extractTickets(bucket && bucket.textContent);
        if (tickets.length === 0) return;

        const current = input.value || '';
        const present = new Set(extractTickets(current));
        const missing = tickets.filter(t => !present.has(t));
        if (missing.length === 0) return;

        // execCommand('insertText') simule une frappe utilisateur : React reçoit
        // un événement input natif et adopte la nouvelle valeur dans son state.
        const newValue = `${missing.join(', ')} - ${current}`;
        input.focus();
        input.select();
        document.execCommand('insertText', false, newValue);
    }

    new MutationObserver(ensurePrefixed).observe(document.body, { childList: true, subtree: true });
    ensurePrefixed();
})();
