// ==UserScript==
// @name         Auto-prefix DEV tickets in GitHub PR title
// @namespace    https://github.com/
// @version      2.0
// @description  Ajoute automatiquement les DEV-XXX des commits au début du titre de la PR sur la page /compare/, si aucun DEV- n'est déjà présent
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastUrl = location.href;
    let alreadyPrefixed = false;
    let observer = null;

    // --- Utilitaires ---
    function extractDevTickets(text) {
        const matches = (text || '').match(/DEV-\d+/gi);
        return matches ? [...new Set(matches.map(m => m.toUpperCase()))] : [];
    }

    function getAllCommitTickets() {
        const tickets = new Set();

        // Tickets Jira liés (issue-link ou hovercard issue)
        document.querySelectorAll(
            '#commits_bucket a.issue-link, #commits_bucket a[data-hovercard-type="issue"]'
        ).forEach(a => {
            extractDevTickets(a.textContent).forEach(t => tickets.add(t));
        });

        // Backup : titres de commits (ancien et nouveau markup)
        document.querySelectorAll(
            '#commits_bucket a.Link--primary, #commits_bucket a.markdown-title, #commits_bucket .commit-message a'
        ).forEach(a => {
            extractDevTickets(a.textContent).forEach(t => tickets.add(t));
        });

        // Dernier recours : scan complet du bucket
        if (tickets.size === 0) {
            const bucket = document.querySelector('#commits_bucket');
            if (bucket) extractDevTickets(bucket.textContent).forEach(t => tickets.add(t));
        }

        return [...tickets];
    }

    function findTitleInput() {
        return document.querySelector('#pull_request_title')
            || document.querySelector('input[name="pull_request[title]"]')
            || document.querySelector('input[aria-label="Title"][type="text"]')
            || document.querySelector('input[placeholder*="Title" i][type="text"]');
    }

    function prefixTitleIfNeeded() {
        if (alreadyPrefixed) return;

        const titleInput = findTitleInput();
        if (!titleInput) return;

        const bucket = document.querySelector('#commits_bucket');
        if (!bucket || bucket.querySelectorAll('a').length === 0) return;

        const currentTitle = titleInput.value || '';
        const existingTickets = new Set(extractDevTickets(currentTitle));
        const allTickets = getAllCommitTickets();
        const ticketsToAdd = allTickets.filter(t => !existingTickets.has(t));

        if (allTickets.length === 0) return; // commits pas encore chargés

        if (ticketsToAdd.length === 0) {
            console.log('[Tampermonkey] Aucun nouveau ticket DEV- à ajouter.');
            alreadyPrefixed = true;
            return;
        }

        titleInput.value = `${ticketsToAdd.join(', ')} - ${currentTitle}`;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`[Tampermonkey] Tickets ajoutés au titre : ${ticketsToAdd.join(', ')}`);
        alreadyPrefixed = true;
    }

    function isComparePage() {
        return /\/compare\//.test(location.href);
    }

    function startObserver() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        alreadyPrefixed = false;

        if (!isComparePage()) return;

        console.log('[Tampermonkey] Observation de la page /compare/...');

        // Tentative immédiate (form déjà ouvert)
        prefixTitleIfNeeded();

        // Sinon : attendre que le champ titre apparaisse via React
        observer = new MutationObserver(() => {
            if (alreadyPrefixed) {
                observer.disconnect();
                observer = null;
                return;
            }
            prefixTitleIfNeeded();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // --- Détection SPA ---
    function onUrlChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('[Tampermonkey SPA] URL changée:', lastUrl);
            startObserver();
        }
    }

    ['pushState', 'replaceState'].forEach(method => {
        const orig = history[method];
        history[method] = function () {
            orig.apply(this, arguments);
            onUrlChange();
        };
    });
    window.addEventListener('popstate', onUrlChange);

    // --- Lancement ---
    startObserver();
})();
