// ==UserScript==
// @name         Omnimed Togglz Button
// @namespace    https://www.omnimed.com/
// @version      2.0
// @description  Bouton pour ouvrir la console Togglz + améliorations de la console (colonne Actions à gauche, bouton "Save and stay open" en édition)
// @author       Marc-Antoine Robert
// @match        https://cloud.dev.omnimed.com/omnimed/*
// @match        https://test.omnimed.com/omnimed/*
// @match        https://itgr.omnimed.com/omnimed/*
// @match        https://stage.omnimed.com/omnimed/*
// @match        https://preprod.omnimed.com/omnimed/*
// @match        https://www.omnimed.com/omnimed/*
// @match        https://app.omnimed.com/omnimed/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    var BUTTON_ID = 'togglzHeaderButton';
    var SAVE_STAY_ID = 'togglzSaveAndStay';

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

    // --- Togglz console: index page ----------------------------------------
    // Move the "Actions" column all the way to the left in every feature table
    // (the page has one table per team tab, all present in the DOM at once).
    var ACTIONS_STYLE_ID = 'togglzActionsStyle';
    function injectActionsColumnStyle() {
        if (document.getElementById(ACTIONS_STYLE_ID)) {
            return;
        }
        var style = document.createElement('style');
        style.id = ACTIONS_STYLE_ID;
        // Shrink the Actions column to its content instead of letting it grab
        // all the leftover width once it becomes the first column.
        style.textContent =
            'table.feature-overview th.feature-actions,' +
            ' table.feature-overview td.feature-actions,' +
            ' table.feature-overview th.feature-status,' +
            ' table.feature-overview td.feature-status {' +
            ' width: 48px !important; min-width: 48px !important;' +
            ' max-width: 48px !important; white-space: nowrap !important;' +
            ' text-align: center !important; }' +
            // Feature column hugs its content but never exceeds 33% of the
            // viewport; long names wrap instead of stretching the column.
            ' table.feature-overview th.feature-label,' +
            ' table.feature-overview td.feature-label {' +
            ' width: 33vw !important; min-width: 33vw !important; max-width: 33vw !important;' +
            ' white-space: normal !important; overflow-wrap: break-word !important; }' +
            // Strategy column greedily takes all remaining width so the other
            // columns stay at their fixed/content width instead of being
            // padded by the auto table-layout leftover-space distribution.
            ' table.feature-overview th.feature-users,' +
            ' table.feature-overview td.feature-strategy {' +
            ' width: 100% !important; }';
        document.head.appendChild(style);
    }

    function moveActionsColumnLeft() {
        var tables = document.querySelectorAll('table.feature-overview');
        if (tables.length) {
            injectActionsColumnStyle();
        }
        Array.prototype.forEach.call(tables, function(table) {
            Array.prototype.forEach.call(table.querySelectorAll('tr'), function(row) {
                var actionsCell = row.querySelector('.feature-actions');
                if (actionsCell && row.firstElementChild !== actionsCell) {
                    row.insertBefore(actionsCell, row.firstElementChild);
                }
            });
        });
    }

    // --- Toast --------------------------------------------------------------
    var TOAST_FLAG = 'togglzSaveToast';

    function showToast(message) {
        var toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = [
            'position: fixed',
            'bottom: 20px',
            'right: 20px',
            'z-index: 2147483647',
            'padding: 12px 20px',
            'background-color: #468847',
            'color: #ffffff',
            'border-radius: 4px',
            'box-shadow: 0 2px 8px rgba(0,0,0,0.25)',
            'font-family: Helvetica, Arial, sans-serif',
            'font-size: 14px',
            'opacity: 0',
            'transition: opacity 0.25s ease-in-out'
        ].join(';');
        document.body.appendChild(toast);
        // Force reflow so the opacity transition runs.
        void toast.offsetWidth;
        toast.style.opacity = '1';
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2500);
    }

    function showPendingToast() {
        var message;
        try {
            message = sessionStorage.getItem(TOAST_FLAG);
        } catch (e) {
            return;
        }
        if (message) {
            sessionStorage.removeItem(TOAST_FLAG);
            showToast(message);
        }
    }

    function flagToast(message) {
        try {
            sessionStorage.setItem(TOAST_FLAG, message);
        } catch (e) {
            /* sessionStorage unavailable: just skip the toast */
        }
    }

    // --- Togglz console: edit page -----------------------------------------
    // Add a "Save and stay open" button that saves the feature via a background
    // POST, then reopens the edit page instead of redirecting to the index.
    function addSaveAndStayButton() {
        var form = document.querySelector('form.form-horizontal');
        if (!form) {
            return;
        }
        var actions = form.querySelector('.form-actions');
        if (!actions || document.getElementById(SAVE_STAY_ID)) {
            return;
        }

        var btn = document.createElement('button');
        btn.id = SAVE_STAY_ID;
        btn.type = 'button';
        btn.className = 'btn btn-success';
        btn.textContent = 'Save and stay open';
        btn.style.marginLeft = '8px';

        var saveBtn = actions.querySelector('input[type="submit"], button[type="submit"]');
        if (saveBtn && saveBtn.nextSibling) {
            actions.insertBefore(btn, saveBtn.nextSibling);
        } else {
            actions.appendChild(btn);
        }

        btn.addEventListener('click', function() {
            btn.disabled = true;

            var featureInput = form.querySelector('input[name="f"]');
            var feature = (featureInput && featureInput.value) ||
                new URLSearchParams(window.location.search).get('f');
            var params = new URLSearchParams(new FormData(form));

            // redirect: 'manual' so we DON'T follow the post-save redirect.
            // Behind the TLS proxy Togglz issues a 302 to an http:// URL, which
            // the browser refuses to follow from an https page (mixed content) —
            // that would make a successful save look like a failure.
            fetch(form.getAttribute('action') || 'edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
                credentials: 'same-origin',
                redirect: 'manual'
            }).then(function(resp) {
                // A redirect (opaqueredirect / status 0 / 3xx) means the save
                // succeeded; we reopen the edit page ourselves to stay in edit.
                if (resp.type === 'opaqueredirect' || resp.status === 0 ||
                    (resp.status >= 300 && resp.status < 400)) {
                    flagToast('Togglz sauvegardé ✓');
                    if (feature) {
                        window.location.href = 'edit?f=' + encodeURIComponent(feature);
                    } else {
                        window.location.reload();
                    }
                    return;
                }
                // Otherwise the server re-rendered the page (usually a validation
                // error): show it so the message is visible.
                return resp.text().then(function(html) {
                    if (/alert-error/.test(html)) {
                        document.open();
                        document.write(html);
                        document.close();
                        // document.write replaced the whole document, so our
                        // button is gone and the observer is detached: re-apply
                        // the enhancements and re-attach the observer.
                        apply();
                        startObserver();
                    } else {
                        flagToast('Togglz sauvegardé ✓');
                        if (feature) {
                            window.location.href = 'edit?f=' + encodeURIComponent(feature);
                        } else {
                            window.location.reload();
                        }
                    }
                });
            }).catch(function() {
                btn.disabled = false;
                alert('Échec de la sauvegarde Togglz.');
            });
        });
    }

    function apply() {
        addTogglzButton();
        moveActionsColumnLeft();
        addSaveAndStayButton();
    }

    var observer = null;
    function startObserver() {
        // The header (and the Togglz pages) can be re-rendered; re-apply if
        // needed. After a document.write the old body is gone, so re-observe
        // the current one.
        if (observer) {
            observer.disconnect();
        }
        observer = new MutationObserver(apply);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    apply();
    showPendingToast();
    startObserver();
})();
