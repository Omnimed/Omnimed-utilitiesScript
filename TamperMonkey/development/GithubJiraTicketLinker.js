// ==UserScript==
// @name         Clickable JIRA Keys on GitHub
// @namespace    https://omnimed.com/
// @version      1.1
// @description  Turns DEV-1234 references into clickable links on GitHub titles, PRs, and commits.
// @author       msamson
// @match        https://github.com/Omnimed/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // === CONFIGURATION ===
    const JIRA_PREFIX = 'DEV-'; // Jira key prefix
    const JIRA_URL = 'https://omnimedjira.atlassian.net/browse/'; // Jira URL

    const JIRA_REGEX = new RegExp(`\\b${JIRA_PREFIX}\\d+\\b`, 'g');

    function convertTextNodeToLinks(node) {
        if (
            node.nodeType === Node.TEXT_NODE &&
            node.parentNode &&
            !['A', 'SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.parentNode.tagName)
        ) {
            const text = node.textContent;
            if (JIRA_REGEX.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(JIRA_REGEX, (match) => {
                    const url = `${JIRA_URL}${match}`;
                    return `<a href="${url}" target="_blank" style="color:#0969da; text-decoration:underline">${match}</a>`;
                });
                node.parentNode.replaceChild(span, node);
            }
        }
    }

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            convertTextNodeToLinks(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const child of Array.from(node.childNodes)) {
                processNode(child);
            }
        }
    }

    function processGitHubTitles() {
        const selectors = [
            '.js-issue-title', // Issue/PR title on detail page
            '.link-gray-dark.h4', // PR list titles (legacy)
            '.Link--primary.v-align-middle', // PR list titles (modern)
            '.commit-title', // Commit messages
            '.comment-body' // Optional: comments in PRs/issues
        ];

        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach(el => {
                processNode(el);
            });
        });

        replaceNumberWithLink();
    }

    function replaceNumberWithLink() {
        const container = document.querySelector('.gh-header-title');
        if (!container || container.dataset.linkified === 'true') return;

        const numberNode = container.children[1]; // second child (the "#1234" span)
        if (!numberNode) return;

        const pageUrl = window.location.href;
        const numberText = numberNode.textContent.trim();

        // Create link
        const link = document.createElement('a');
        link.href = pageUrl;
        link.textContent = numberText;
        link.style.color = '#0969da';
        link.style.textDecoration = 'underline';
        link.style.marginLeft = '4px';

        // Replace original node
        container.replaceChild(link, numberNode);
        container.dataset.linkified = 'true';
    }

    // Run initially
    processGitHubTitles();

    // Re-run on dynamic content load (for SPA-style GitHub navigation)
    const observer = new MutationObserver(() => {
        processGitHubTitles();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
