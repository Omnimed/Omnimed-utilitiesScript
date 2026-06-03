// ==UserScript==
// @name         Omnimed Togglz Button
// @namespace    https://www.omnimed.com/
// @version      0.1
// @description  Add a button next to the patient search to open the Togglz console in a new tab
// @author       Marc-Antoine Robert
// @match        https://cloud.dev.omnimed.com/omnimed/*
// @match        https://test.omnimed.com/omnimed/*
// @match        https://itgr.omnimed.com/omnimed/*
// @match        https://stage.omnimed.com/omnimed/*
// @match        https://preprod.omnimed.com/omnimed/*
// @match        https://www.omnimed.com/omnimed/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    var BUTTON_ID = 'togglzHeaderButton';

    function addTogglzButton() {
        var searchContainer = document.getElementById('headerSearchContainer');
        if (!searchContainer || document.getElementById(BUTTON_ID)) {
            return;
        }

        var button = document.createElement('a');
        button.id = BUTTON_ID;
        button.href = window.location.origin + '/omnimed/togglz';
        button.target = '_blank';
        button.rel = 'noopener';
        button.title = 'Togglz';
        button.style.cssText = [
            'display: inline-flex',
            'align-items: center',
            'justify-content: center',
            'vertical-align: middle',
            'width: 28px',
            'height: 28px',
            'margin-left: 8px',
            'border-radius: 50%',
            'background-color: rgba(255, 255, 255, 0.15)',
            'cursor: pointer'
        ].join(';');

        // Toggle switch icon
        button.innerHTML =
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="#ffffff">' +
            '<path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>' +
            '</svg>';

        button.addEventListener('mouseenter', function() {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        });
        button.addEventListener('mouseleave', function() {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        });

        searchContainer.appendChild(button);
    }

    addTogglzButton();

    // The header can be re-rendered by JSF ajax updates; re-add the button if it disappears
    new MutationObserver(addTogglzButton).observe(document.body, { childList: true, subtree: true });
})();
