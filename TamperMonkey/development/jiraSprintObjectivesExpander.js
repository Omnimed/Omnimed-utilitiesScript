// ==UserScript==
// @name         Jira Sprint Objectives Expander
// @namespace    https://omnimedjira.atlassian.net/
// @version      1.6.0
// @description  Expand the "active sprints" popup on the Jira board and render its markdown body.
// @author       acloutier
// @match        https://omnimedjira.atlassian.net/jira/software/c/projects/*/boards/*
// @run-at       document-idle
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js
// ==/UserScript==

(function () {
  'use strict';

  const DIALOG_SELECTOR =
    'div[role="dialog"][aria-label="Popup with details about the current active sprints"]';
  const RENDERED_FLAG = 'sprintPopupMdRendered';

  const css = `
    html body ${DIALOG_SELECTOR} {
      width: 1100px !important;
      max-width: calc(100vw - 48px) !important;
      height: auto !important;
      max-height: calc(100vh - 88px) !important;
      overflow: auto !important;
      inset: auto !important;
      top: 64px !important;
      right: 24px !important;
      left: auto !important;
      bottom: auto !important;
      transform: none !important;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45) !important;
      padding: 4px !important;
      box-sizing: border-box !important;
    }
    html body ${DIALOG_SELECTOR} > div,
    html body ${DIALOG_SELECTOR} > div > div,
    html body ${DIALOG_SELECTOR} article,
    html body ${DIALOG_SELECTOR} article > div,
    html body ${DIALOG_SELECTOR} article > div > div,
    html body ${DIALOG_SELECTOR} article * {
      width: auto !important;
      max-width: 100% !important;
      min-width: 0 !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }
    html body ${DIALOG_SELECTOR} > div,
    html body ${DIALOG_SELECTOR} > div > div,
    html body ${DIALOG_SELECTOR} article,
    html body ${DIALOG_SELECTOR} article > div,
    html body ${DIALOG_SELECTOR} article > div > div {
      width: 100% !important;
      padding-top: 6px !important;
      padding-bottom: 6px !important;
      gap: 6px !important;
    }
    html body ${DIALOG_SELECTOR} h2 {
      margin: 0 0 4px !important;
      font-size: 15px !important;
      line-height: 1.2 !important;
    }
    html body ${DIALOG_SELECTOR} h2 strong {
      font-size: 15px !important;
      line-height: 1.2 !important;
    }
    html body ${DIALOG_SELECTOR} .css-vlrcub,
    html body ${DIALOG_SELECTOR} .css-1qiwaaz {
      font-size: 11px !important;
      line-height: 1.2 !important;
    }
    html body ${DIALOG_SELECTOR} .css-1izq36y {
      display: flex !important;
      flex-direction: row !important;
      gap: 16px !important;
      margin-top: 4px !important;
    }
    html body ${DIALOG_SELECTOR} [style*="-webkit-line-clamp"] {
      -webkit-line-clamp: unset !important;
      display: block !important;
      overflow: visible !important;
      white-space: normal !important;
      max-height: none !important;
      width: 100% !important;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md {
      line-height: 1.4;
      font-size: 15px;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md h1,
    ${DIALOG_SELECTOR} .sprint-popup-md h2,
    ${DIALOG_SELECTOR} .sprint-popup-md h3,
    ${DIALOG_SELECTOR} .sprint-popup-md h4 {
      margin: 10px 0 4px;
      font-weight: 600;
      line-height: 1.2;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md h1 { font-size: 1.3em; }
    ${DIALOG_SELECTOR} .sprint-popup-md h2 { font-size: 1.15em; }
    ${DIALOG_SELECTOR} .sprint-popup-md h3 { font-size: 1.05em; }
    ${DIALOG_SELECTOR} .sprint-popup-md h4 { font-size: 1.0em; }
    ${DIALOG_SELECTOR} .sprint-popup-md ul,
    ${DIALOG_SELECTOR} .sprint-popup-md ol {
      margin: 2px 0 6px 22px;
      padding: 0;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md li { margin: 1px 0; }
    ${DIALOG_SELECTOR} .sprint-popup-md p { margin: 4px 0; }
    ${DIALOG_SELECTOR} .sprint-popup-md code {
      background: rgba(255,255,255,0.08);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md pre {
      background: rgba(255,255,255,0.06);
      padding: 8px 10px;
      border-radius: 4px;
      overflow: auto;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md blockquote {
      margin: 6px 0;
      padding: 2px 10px;
      border-left: 3px solid rgba(255,255,255,0.25);
      color: inherit;
      opacity: 0.85;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md a {
      color: #579dff;
      text-decoration: underline;
    }
    ${DIALOG_SELECTOR} .sprint-popup-md hr {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.15);
      margin: 10px 0;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.documentElement.appendChild(styleEl);

  if (window.marked && typeof window.marked.setOptions === 'function') {
    window.marked.setOptions({ breaks: true, gfm: true });
  }

  function renderMarkdownIn(dialog) {
    const spans = dialog.querySelectorAll('span.css-1y7y8ci, span[style*="-webkit-line-clamp: 2"]');
    spans.forEach((span) => {
      if (span.dataset[RENDERED_FLAG] === '1') return;
      if (span.querySelector('h1, h2, h3, h4, ul, ol, p, pre, blockquote')) return;

      const raw = span.textContent || '';
      if (!raw.trim()) return;

      try {
        const html = window.marked.parse(raw);
        span.innerHTML = html;
        span.classList.add('sprint-popup-md');
        span.dataset[RENDERED_FLAG] = '1';
      } catch (err) {
        console.error('[sprint-popup-expander] markdown render failed', err);
      }
    });
  }

  function process() {
    document.querySelectorAll(DIALOG_SELECTOR).forEach(renderMarkdownIn);
  }

  const observer = new MutationObserver(process);
  observer.observe(document.body, { childList: true, subtree: true });

  process();
})();
