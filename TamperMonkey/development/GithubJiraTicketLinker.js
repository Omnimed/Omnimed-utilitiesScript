// ==UserScript==
// @name         Clickable JIRA Keys on GitHub
// @namespace    https://omnimed.com/
// @version      1.5
// @description  Turns DEV-1234 references into clickable links on GitHub titles, PRs, and commits.
// @author       msamson
// @match        https://github.com/Omnimed/*
// @icon         https://github.githubassets.com/favicons/favicon.png
// @updateURL    https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/GithubJiraTicketLinker.js
// @downloadURL  https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/GithubJiraTicketLinker.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // === CONFIGURATION ===
    const JIRA_PREFIX = 'DEV-'; // Jira key prefix
    const JIRA_URL = 'https://omnimedjira.atlassian.net/browse/'; // Jira URL

    const JIRA_REGEX = new RegExp(`\\b(${JIRA_PREFIX}\\d+)\\b`, 'gi');
    const ISSUE_NUMBER_REGEX = /^#\d+$/;
    const SKIP_INSIDE = 'a, script, style, textarea';
    const COPY_LABEL = 'Copier le titre avec les liens';
    const COPY_ICON = '<path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>';
    const CHECK_ICON = '<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>';

    function convertTextNodeToLinks(node) {
        if (node.parentElement.closest(SKIP_INSIDE)) return;

        const parts = node.textContent.split(JIRA_REGEX); // odd indices hold the Jira keys
        if (parts.length === 1) return;

        const fragment = document.createDocumentFragment();
        parts.forEach((part, index) => {
            if (index % 2 === 0) {
                fragment.append(part);
                return;
            }
            const link = document.createElement('a');
            link.href = JIRA_URL + part.toUpperCase();
            link.target = '_blank';
            link.textContent = part;
            link.style.cssText = 'color:#0969da; text-decoration:underline';
            fragment.append(link);
        });

        node.replaceWith(fragment);
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
            '.markdown-title', // PR title on experimental page
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

    // The "#1234" sits inside the title on the classic header and next to it on the
    // React one, so search from the parent. Leaves only, which skips the screen-reader
    // copy ("- #1234") and makes a second pass a no-op once the number holds our <a>.
    function findNumberElement(header) {
        return header && Array.from(header.parentElement.querySelectorAll('*')).find((el) =>
            !el.firstElementChild && ISSUE_NUMBER_REGEX.test(el.textContent.trim()) && !el.closest('a')
        );
    }

    function replaceNumberWithLink() {
        const header = document.querySelector('.gh-header-title') ??
            document.querySelector('[data-component="PH_Title"]');
        const numberNode = findNumberElement(header);
        if (!numberNode) return;

        const link = document.createElement('a');
        link.href = location.pathname.split('/').slice(0, 5).join('/'); // /Omnimed/repo/pull/1234
        link.textContent = numberNode.textContent.trim();
        link.style.setProperty("color", "#0969da", "important");
        link.style.textDecoration = 'underline';

        numberNode.replaceChildren(link); // keep GitHub's span, so its classes and aria-hidden stay

        addCopyButton(header, numberNode);
    }

    // Copies the title with its links live: rich HTML for Slack or Confluence, plain
    // text for everything else.
    function addCopyButton(header, numberNode) {
        const editButton = numberNode.parentElement.querySelector('button');
        if (!editButton) return;

        const button = editButton.cloneNode(true); // borrow GitHub's own button styling
        button.removeAttribute('aria-labelledby');
        button.setAttribute('aria-label', COPY_LABEL);
        button.title = COPY_LABEL;

        const icon = button.querySelector('svg');
        icon.innerHTML = COPY_ICON;

        button.addEventListener('click', () => {
            const title = header.cloneNode(true);
            title.querySelector('.sr-only')?.remove(); // the hidden " - #123" duplicate
            const number = numberNode.textContent.trim();
            const numberUrl = numberNode.querySelector('a').href;

            navigator.clipboard.write([new ClipboardItem({
                'text/html': new Blob([`${title.innerHTML} - <a href="${numberUrl}">${number}</a>`], { type: 'text/html' }),
                'text/plain': new Blob([`${title.textContent.trim()} - ${number}`], { type: 'text/plain' })
            })]).then(() => {
                icon.innerHTML = CHECK_ICON;
                setTimeout(() => { icon.innerHTML = COPY_ICON; }, 1500);
            });
        });

        editButton.after(button);
    }

    // Run initially
    processGitHubTitles();

    // Re-run on dynamic content load (for SPA-style GitHub navigation), at most once per frame
    let scheduled = false;
    new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            processGitHubTitles();
        });
    }).observe(document.body, { childList: true, subtree: true });
})();
