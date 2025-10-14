// ==UserScript==
// @name         Auto-prefix DEV tickets in GitHub PR title
// @namespace    https://github.com/
// @version      1.0
// @description  Ajoute automatiquement les DEV-XXX des commits au début du titre de la PR après clic sur "Create pull request", si aucun DEV- n’est déjà présent
// @match        https://github.com/*
// @grant        none
// ==/UserScript==

// variables
const MAX_RETRIES = 5;
let retryCount = 0;
let lastUrl = location.href;

// ----------------- Détection SPA -----------------
function onUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (/\/compare\//.test(location.href)) {
        console.log('[Tampermonkey SPA] URL /compare/... détectée, relance du script.');
        startScript();
      }
    }
  };

// Hook history.pushState et replaceState
//const pushState = history.pushState;
//history.pushState = function() {
//    pushState.apply(this, arguments);
//   onUrlChange();
//};

const replaceState = history.replaceState;
history.replaceState = function() {
    replaceState.apply(this, arguments);
    onUrlChange();
};

// popstate pour back/forward
window.addEventListener('popstate', onUrlChange);

// --- Utilitaires ---
function extractDevTickets(text) {
    const matches = text.match(/DEV-\d+/gi);
    return matches ? [...new Set(matches)] : [];
  };

function getAllCommitTickets() {
  const tickets = new Set();

    // Tickets Jira liés dans les commits
    document.querySelectorAll('#commits_bucket a.issue-link').forEach(a => {
      const txt = a.textContent.trim();
      if (/DEV-\d+/.test(txt)) tickets.add(txt);
    });

    // Backup : mentions dans les messages de commit
    document.querySelectorAll('#commits_bucket a.Link--primary.text-bold').forEach(a => {
      extractDevTickets(a.textContent).forEach(t => tickets.add(t));
    });

    return [...tickets];
  };

function prefixTitleIfNeeded() {
    const titleInput = document.querySelector('#pull_request_title');
    if (!titleInput) return;

    const currentTitle = titleInput.value;

    // Récupère tous les DEV-XXX dans le titre existant
    const existingTickets = new Set(currentTitle.match(/DEV-\d+/gi) || []);

    // Récupère tous les tickets DEV-XXX dans les commits
    const allTickets = getAllCommitTickets();

    // Filtre ceux déjà présents dans le titre
    console.log(existingTickets, allTickets);
    const ticketsToAdd = allTickets.filter(t => !existingTickets.has(t));

    if (ticketsToAdd.length === 0) {
        console.log('[Tampermonkey] Aucun nouveau ticket DEV- à ajouter.');
        return;
    }

    // Ajoute les nouveaux tickets au début du titre
    titleInput.value = `${ticketsToAdd.join(', ')} - ${currentTitle}`;
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log(`[Tampermonkey] Tickets ajoutés au titre : ${ticketsToAdd.join(', ')}`);
};

  // --- Observation du clic sur le bouton "Create pull request" ---
function waitForButton() {
    const button = document.querySelector('button.js-details-target.btn-primary.btn');
    if (!button) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`[Tampermonkey] Bouton non trouvé (tentative ${retryCount}/${MAX_RETRIES})…`);
        setTimeout(waitForButton, 1000);
      } else {
        console.warn('[Tampermonkey] Bouton non trouvé après 5 tentatives. Abandon.');
      }
      return;
    }

    console.log('[Tampermonkey] Bouton "Create pull request" trouvé.');

    button.addEventListener('click', () => {
      console.log('[Tampermonkey] Clic détecté sur "Create pull request". Surveillance du champ titre...');
      const titleInput = document.querySelector('#pull_request_title');
      if (titleInput) {
          console.log('[Tampermonkey] Champ titre détecté, traitement en cours...');
          prefixTitleIfNeeded();
      }
    });
};

// ----------------- Lancement -----------------
function startScript(){
    console.log('[Tampermonkey] Démarrage du script...');
    waitForButton();
  };

if (/\/compare\//.test(location.href)) {startScript()};
