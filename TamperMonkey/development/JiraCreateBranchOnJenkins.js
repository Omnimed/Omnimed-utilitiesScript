// ==UserScript==
// @name         Jira Hijack Create Branch Link
// @namespace    http://tampermonkey.net/
// @version      1.3
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

    const JENKINS_URL_BASE = "https://jenkins.omnimed.com/job/CreateFeatureBranch/build?delay=0sec&branchName=";
    const TEAM_TAG_MAP = {
        "Brainiacs": "ai",
        "Chill Pills": "cp",
        "DaftPunk": "dp",
        "ETL": "etl",
        "Gate Keepers": "gk",
        "QA": "qa",
        "Requesters": "req",
        "Starship Troopers": "st",
        "Time Twisters": "tt",

    };

    function kebabify(text) {
        return text.normalize("NFD")
                   .toLowerCase()
                   .replace(/[^\w\s-]/g, '')
                   .replace(/\s+/g, '-')
                   .replace(/-+/g, '-');
    }

    function getTeamTagFromComponent() {
        const componentElem = document.querySelector(SELECTOR_FOR_TEAM);
        const component = componentElem?.innerText.trim();
        return TEAM_TAG_MAP[component] || component;
    }

    function hijackCreateBranchLink() {
        const link = document.querySelector(SELECTOR_CREATE_BRANCH);
        if (!link || link.classList.contains('hijacked')) return;

        link.classList.add('hijacked');
        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const issueKey = document.querySelector(SELECTOR_FOR_ISSUE)?.innerText.trim();
            const title = document.querySelector(SELECTOR_FOR_TITLE)?.innerText.trim();
            const teamTag = getTeamTagFromComponent();

            if (!issueKey || !title || !teamTag) {
                alert("Missing required Jira fields." + issueKey + " " + title + " " + teamTag);
            }

            const ticketNumber = issueKey.split('-')[1]; // Get just the number
            const branchName = `fd-${teamTag}-${ticketNumber}-${kebabify(title)}`;
            const jenkinsUrl = `${JENKINS_URL_BASE}${encodeURIComponent(branchName)}`;

            window.open(jenkinsUrl, "_blank");
        });
    }

    // Observe Jira DOM
    const observer = new MutationObserver(() => hijackCreateBranchLink());
    observer.observe(document.body, { childList: true, subtree: true });
})();
