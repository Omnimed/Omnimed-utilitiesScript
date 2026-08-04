// ==UserScript==
// @name         Jira Hijack Create Branch Link
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Hijack Jira's Create Branch link, generate branch name, and pass to Jenkins
// @author       msamson
// @match        https://omnimedjira.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @updateURL    https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/JiraCreateBranchOnJenkins.js
// @downloadURL  https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/JiraCreateBranchOnJenkins.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const SELECTOR_CREATE_BRANCH = '[href*="https://github.atlassian.com/create-branch"]';
    const SELECTOR_FOR_ISSUE = '[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]';
    const SELECTOR_FOR_TEAM = '[data-testid="issue-field-team.ui.view-team-name"]';
    const SELECTOR_FOR_TITLE = '[data-testid="issue.views.issue-base.foundation.summary.heading"]';

    const JENKINS_URL_BASE = "https://jenkins.omnimed.com/job/CreateFeatureBranch/build?delay=0sec&";
    const FEATURE_NAME_MAX_LENGTH = 67;

    // Values must match the <option> values of the "teamName" dropdown on the
    // Jenkins CreateFeatureBranch parameterized-build page (verified live:
    // brainiacs, chillpills, daftpunk, ETL, qa, requesters, starshiptroopers,
    // gatekeepers, timetwisters — no other values are valid).
    const TEAM_TAG_MAP = {
        "Brainiacs": "brainiacs",
        "Chill Pills": "chillpills",
        "Chill Bills": "chillpills", // Chill Pills/Chill Bills aren't officially split in Jenkins yet; both use chillpills
        "DaftPunk": "daftpunk",
        "ETL": "ETL",
        "Gate Keepers": "gatekeepers",
        "QA": "qa",
        "Requesters": "requesters",
        "Starship Troopers": "starshiptroopers",
        "Time Twisters": "timetwisters",
    };

    function kebabify(text) {
        return text.normalize("NFD")
                   .toLowerCase()
                   .replace(/[^\w\s-]/g, '')
                   .replace(/\s+/g, '-')
                   .replace(/-+/g, '-');
    }

    function getTeamNameFromComponent() {
        const componentElem = document.querySelector(SELECTOR_FOR_TEAM);
        const component = componentElem?.innerText.trim();
        return TEAM_TAG_MAP[component] || component;
    }

    // "GitHub" is kept untranslated by Atlassian's localized UI strings, so a
    // plain substring swap works no matter what language Jira is displayed in.
    function relabelGithubToJenkins(el) {
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.includes('GitHub')) {
                    node.textContent = node.textContent.replace(/GitHub/g, 'Jenkins');
                }
            } else {
                relabelGithubToJenkins(node);
            }
        }
    }

    function hijackCreateBranchLink() {
        const link = document.querySelector(SELECTOR_CREATE_BRANCH);
        if (!link || link.classList.contains('hijacked')) return;

        relabelGithubToJenkins(link);
        link.classList.add('hijacked');
        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const issueKey = document.querySelector(SELECTOR_FOR_ISSUE)?.innerText.trim();
            const title = document.querySelector(SELECTOR_FOR_TITLE)?.innerText.trim();
            const teamName = getTeamNameFromComponent();

            if (!issueKey || !title || !teamName) {
                alert("Missing required Jira fields." + issueKey + " " + title + " " + teamName);
                return;
            }

            const ticketNumber = issueKey.split('-')[1]; // Get just the number
            const featureName = kebabify(title).slice(0, FEATURE_NAME_MAX_LENGTH);

            const params = new URLSearchParams({
                teamName: teamName,
                ticketNumber: ticketNumber,
                featureName: featureName,
            });

            const jenkinsUrl = `${JENKINS_URL_BASE}${params.toString()}`;

            window.open(jenkinsUrl, "_blank");
        });
    }

    // Observe Jira DOM
    const observer = new MutationObserver(() => hijackCreateBranchLink());
    observer.observe(document.body, { childList: true, subtree: true });
})();
