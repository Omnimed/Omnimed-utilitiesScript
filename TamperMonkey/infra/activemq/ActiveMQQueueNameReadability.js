// ==UserScript==
// @name         ActiveMQ console — readable queue names
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Un-truncate queue/topic names on the ActiveMQ admin console, widen the Name column, and toggle the noisy "integration." prefix (hidden by default)
// @author       Antoine Cloutier
// @match        http://*/admin/queues.jsp*
// @match        http://*/admin/topics.jsp*
// @include      http://localhost:*/admin/queues.jsp*
// @include      http://localhost:*/admin/topics.jsp*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const TABLE_IDS = ['queues', 'topics'];
    const PREFIX = 'integration.';
    const STORAGE_KEY = 'amq.hideIntegrationPrefix';

    // Build a selector per table and join with commas. Never interpolate a
    // comma-separated list into a compound selector: "a, b > c" parses as
    // "a" plus "b > c", not "(a, b) > c".
    const sel = (suffix) => TABLE_IDS.map((id) => `table#${id}${suffix}`).join(', ');

    const CELLS = sel(' > tbody > tr > td:first-child');

    // --- 1. Layout: give the Name column all the leftover width ------------
    const css = `
        /* The console ships a fixed-width layout; let it use the full window. */
        body,
        .white_box,
        .content,
        .content_l,
        .content_r,
        .body-content {
            width: auto !important;
            max-width: none !important;
        }

        ${sel('')} {
            width: 100% !important;
            table-layout: auto !important;
        }

        /* Nothing wraps: every column shrinks to its content... */
        ${sel(' th')},
        ${sel(' td')} {
            white-space: nowrap !important;
        }

        /* ...except the first one, which absorbs the remaining space. */
        ${sel(' > thead > tr > th:not(:first-child)')},
        ${sel(' > tbody > tr > td:not(:first-child)')} {
            width: 1%;
        }

        /* Numeric columns (2-5) right-aligned; the Name column stays left. */
        ${sel(' > tbody > tr > td:nth-child(n+2):nth-child(-n+5)')} {
            text-align: right;
        }

        ${CELLS} {
            text-align: left !important;
            padding-right: 1.5em;
        }

        ${CELLS} a {
            font-family: ui-monospace, "DejaVu Sans Mono", monospace;
        }

        button.amq-prefix-toggle {
            margin-left: 1em;
            padding: 0.15em 0.6em;
            font: inherit;
            font-size: 0.7em;
            font-weight: normal;
            cursor: pointer;
            border: 1px solid #999;
            border-radius: 3px;
            background: #eee;
            vertical-align: middle;
        }

        button.amq-prefix-toggle:hover {
            background: #ddd;
        }

        button.amq-prefix-toggle[aria-pressed="true"] {
            background: #fdf3d0;
            border-color: #c8a92a;
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // --- 2. Collect the real (untruncated) name of every row ---------------
    // queues.jsp truncates long names server-side and renders them as:
    //   <span class="tooltip"> short.name.... <span>full.name</span></span>
    // The full name lives in the nested span, revealed only on hover.
    const fullNameFromHref = (anchor) => {
        try {
            return new URL(anchor.href, location.href).searchParams.get('JMSDestination');
        } catch {
            return null;
        }
    };

    const rows = [];
    let truncated = 0;

    document.querySelectorAll(CELLS).forEach((cell) => {
        const anchor = cell.querySelector('a');
        if (!anchor) return;

        const tip = cell.querySelector('span.tooltip');
        const inner = tip && tip.querySelector('span');
        if (tip) truncated++;

        const full = (inner && inner.textContent.trim())
                  || fullNameFromHref(anchor)
                  || anchor.textContent.trim();
        if (!full) return;

        anchor.title = full; // the hover tooltip we are about to replace
        rows.push({ anchor, full });
    });

    // --- 3. Render, with the "integration." prefix hidden by default -------
    const stored = localStorage.getItem(STORAGE_KEY);
    let hidden = stored === null ? true : stored === '1';

    const affected = rows.filter((r) => r.full.startsWith(PREFIX)).length;

    const render = () => {
        for (const { anchor, full } of rows) {
            // Setting textContent also drops the tooltip span, showing the full name.
            anchor.textContent = hidden && full.startsWith(PREFIX)
                ? full.slice(PREFIX.length)
                : full;
        }
    };

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'amq-prefix-toggle';

    const paint = () => {
        button.setAttribute('aria-pressed', String(hidden));
        button.textContent = hidden
            ? `show "${PREFIX}" prefix (${affected})`
            : `hide "${PREFIX}" prefix (${affected})`;
        button.title = hidden
            ? `${affected} name(s) have the "${PREFIX}" prefix stripped for readability. Full name is in the link tooltip.`
            : `Showing full names. Click to strip the leading "${PREFIX}" from ${affected} name(s).`;
    };

    button.addEventListener('click', () => {
        hidden = !hidden;
        localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
        render();
        paint();
    });

    const table = document.querySelector(sel(''));
    if (table && affected) {
        const heading = table.previousElementSibling;
        if (heading && heading.tagName === 'H2') {
            heading.appendChild(button);
        } else {
            table.parentNode.insertBefore(button, table);
        }
    }

    render();
    paint();

    console.info(
        `[activemq-readable-names] ${rows.length} row(s), ${truncated} un-truncated, ` +
        `${affected} with "${PREFIX}" prefix (hidden=${hidden})`
    );
})();
