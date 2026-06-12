// ==UserScript==
// @name         Omnimed - Copy Form to Clipboard
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Copies the form's FR + EN content to the clipboard as Markdown.
// @author       You
// @match        https://app.omnimed.com/omnimed/do/dashboard/adminDashboard
// @match        https://app.omnimed.com/omnimed/do/dashboard/adminDashboard?*
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

// Grabs the whole form (FR+EN) at once: open one element to load hidden data, then read it all.

(function () {
  'use strict';

  // The button's id, the page it belongs on, and the toolbar element it sits beside.
  const COPY_BUTTON_ID = 'tm-copy-section-btn';
  const ADMIN_DASHBOARD_PATH = '/omnimed/do/dashboard/adminDashboard';
  const TOOLBAR_ANCHOR_ID = 'adminFormFormListButton';

  // Look of the icon inside the button.
  const ICON_SIZE_PX = 20;
  const ICON_COLOR = '#555555';

  // Max 32-bit int, so it sits above everything on the page.
  const OVERLAY_Z_INDEX = '2147483647';

  // Timings.
  const SUCCESS_FLASH_MS = 200;  // checkmark hold + fade (flashSuccess)
  const POLL_INTERVAL_MS = 100;  // gap between checks for timer-based polling (poll)
  const POLL_TIMEOUT_MS = 10000; // failure ceiling for any poll / waitFor wait

  // SVG path data for the two icon states (copy = idle, check = just-copied).
  const COPY_ICON_PATH = 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z';
  const CHECK_ICON_PATH = 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';

  // Rich-text (OUTPUT_TEXT) bodies live in two TinyMCE editors with these stable ids.
  const OUTPUT_TEXT_FR_ID = 'outputTextEditorTextFr';
  const OUTPUT_TEXT_EN_ID = 'outputTextEditorTextEn';

  // The page's real window (TinyMCE lives there), not the userscript sandbox's window.
  const PAGE_WINDOW = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;

  let extractionInProgress = false;

  /**
   * Build the copy icon, centered within the button's icon box.
   * @returns {SVGSVGElement} the styled copy-icon SVG.
   */
  function makeIcon() {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', ICON_COLOR);
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', COPY_ICON_PATH);
    svg.appendChild(path);

    // Center inside the icon span: top-left at 50%/50%, then pull back by half the icon size.
    const halfOffset = `-${ICON_SIZE_PX / 2}px`;
    Object.assign(svg.style, {
      width: `${ICON_SIZE_PX}px`,
      height: `${ICON_SIZE_PX}px`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: halfOffset,
      marginLeft: halfOffset,
      pointerEvents: 'none'
    });
    return svg;
  }

  /**
   * Briefly swap the copy icon for a checkmark, then fade back to the copy icon.
   * @param {HTMLButtonElement} btn  the copy button to animate.
   * @returns {void}
   */
  function flashSuccess(btn) {
    const svg = btn.querySelector('svg');
    const path = svg && svg.querySelector('path');
    if (!svg || !path) return;

    svg.style.transition = 'none';
    svg.style.opacity = '1';
    path.setAttribute('d', CHECK_ICON_PATH);

    setTimeout(() => {
      svg.style.transition = `opacity ${SUCCESS_FLASH_MS}ms ease`;
      svg.style.opacity = '0';
    }, SUCCESS_FLASH_MS);

    setTimeout(() => {
      svg.style.transition = 'none';
      path.setAttribute('d', COPY_ICON_PATH);
      void svg.getBoundingClientRect(); // force reflow so the restored transition animates
      svg.style.transition = `opacity ${SUCCESS_FLASH_MS}ms ease`;
      svg.style.opacity = '1';
    }, SUCCESS_FLASH_MS + SUCCESS_FLASH_MS);
  }

  /**
   * Write text to the clipboard via GM_setClipboard.
   * @param {string} text  the text to copy.
   * @returns {boolean} true on success, false if the write threw.
   */
  function copyText(text) {
    try {
      GM_setClipboard(text, { type: 'text', mimetype: 'text/plain' });
      return true;
    } catch (err) {
      console.error("Échec de l'écriture dans le presse-papiers", err);
      return false;
    }
  }

  /**
   * Poll until the condition returns truthy, or POLL_TIMEOUT_MS elapses (use waitFor for DOM changes).
   * @param {() => *} condition  predicate checked each tick.
   * @returns {Promise<*>} the truthy result, or false on timeout.
   */
  async function poll(condition) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      const result = condition();
      if (result) return result;
    }
    return false;
  }

  /**
   * Resolve once `condition()` is truthy, re-checked on each DOM mutation batch (false after POLL_TIMEOUT_MS).
   * @param {() => *} condition  predicate re-checked on each mutation batch.
   * @param {Node} [root]  subtree to observe (defaults to document.body).
   * @returns {Promise<*>} the truthy result, or false on timeout.
   */
  function waitFor(condition, root = document.body) {
    return new Promise(resolve => {
      const observer = new MutationObserver(checkCondition);
      const timer = setTimeout(() => settle(false), POLL_TIMEOUT_MS);

      // Tear down the observer and timer, then resolve the promise exactly once.
      function settle(result) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(result);
      }

      // Re-check on each mutation batch; resolve as soon as the condition holds.
      function checkCondition() {
        const result = condition();
        if (result) settle(result);
      }

      // Check once up front to catch a change that landed before we attached.
      const alreadyMet = condition();
      if (alreadyMet) return settle(alreadyMet);
      // No attributes: panel reloads swap subtrees; value changes don't fire attr mutations.
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    });
  }

  /**
   * Signature of the edit panel; changes when a new element loads.
   * @returns {string} signature string for the current panel.
   */
  function getPanelSignature() {
    const panel = document.getElementById('adminFormAreaFragment');
    // OUTPUT_TEXT bodies live in TinyMCE editors outside the panel, so textContent misses them.
    const tinymce = PAGE_WINDOW.tinymce;
    // Control-char separators can't appear in form text; format:'text' avoids serializing HTML.
    const FIELD_SEP = '␟';
    const EDITOR_SEP = '␞';
    const editorText = tinymce
      ? [OUTPUT_TEXT_FR_ID, OUTPUT_TEXT_EN_ID].map(id => {
          const editor = tinymce.get(id);
          return editor && editor.initialized ? editor.getContent({ format: 'text' }) : '';
        }).join(EDITOR_SEP)
      : '';
    return [
      document.getElementById('adminFormElementAliasInputText')?.value ?? null,
      document.getElementById('formElementTermFrenchTermInputText')?.value ?? null,
      document.getElementById('formElementTermEnglishTermInputText')?.value ?? null,
      panel?.textContent?.length ?? 0,
      editorText
    ].join(FIELD_SEP);
  }

  /**
   * Click an element row open and wait for its edit panel to load.
   * @param {string} anchorId  id of the row link to click.
   * @param {string} [expectedAlias]  alias to wait for in the loaded panel.
   * @returns {Promise<boolean>} true once the panel is loaded.
   */
  async function openPanel(anchorId, expectedAlias) {
    const signatureBeforeClick = getPanelSignature();
    const anchorEl = document.getElementById(anchorId);
    if (!anchorEl) return false;

    anchorEl.click();
    const aliasRequested = !!expectedAlias;
    // Aliased: wait on the alias input (immune to signature collisions); else wait for sig change.
    const panelLoaded = await waitFor(() => {
      if (aliasRequested) {
        const loadedAlias = document.getElementById('adminFormElementAliasInputText')?.value;
        return loadedAlias === expectedAlias;
      }
      return getPanelSignature() !== signatureBeforeClick;
    });

    // Return the real result: on timeout the caller records a placeholder, not a stale panel.
    return panelLoaded;
  }

  /**
   * Close the open edit panel and wait for the "new element" placeholder to return.
   * @returns {Promise<void>} resolves once the panel is closed.
   */
  async function restore() {
    const cancel = document.getElementById('adminFormElementCancelFormAreaCommandButton');
    if (!cancel) return;
    cancel.click();
    await waitFor(() => !!document.getElementById('adminFormAreaNewElement'));
  }

  /**
   * Read the FR/EN answer choices off the open panel. Collects inputs by id pattern and orders by
   * index, so a non-contiguous index (e.g. a gap left by a deleted choice) doesn't truncate the rest.
   * @returns {{fr: string, en: string}[]} one FR/EN pair per choice, in index order.
   */
  function scrapeChoices() {
    const byIndex = new Map();
    // Match a choice input id, capturing its numeric index and Fr/En language suffix.
    const idPattern = /^formChoiceList:(\d+):formChoice(Fr|En)$/;
    // Scope to the open panel so we don't read hidden choice inputs left from a prior element.
    const panel = document.getElementById('adminFormAreaFragment') || document;
    panel.querySelectorAll('[id^="formChoiceList:"]').forEach(input => {
      const match = input.id.match(idPattern);
      if (!match) return;
      const index = Number(match[1]);
      let entry = byIndex.get(index);
      if (!entry) { entry = { fr: '', en: '' }; byIndex.set(index, entry); }
      entry[match[2] === 'Fr' ? 'fr' : 'en'] = input.value || '';
    });
    return Array.from(byIndex.keys()).sort((a, b) => a - b).map(index => byIndex.get(index));
  }

  /**
   * OUTPUT_TEXT FR/EN live in two TinyMCE editors with stable ids; their <textarea>s sit outside
   * #adminFormAreaFragment, so read the editors directly.
   * @returns {{fr: string|null, en: string|null}} editor HTML, or null if absent.
   */
  function scrapeOutputText() {
    const tinymce = PAGE_WINDOW.tinymce;
    if (!tinymce) return { fr: null, en: null };

    const frEditor = tinymce.get(OUTPUT_TEXT_FR_ID);
    const enEditor = tinymce.get(OUTPUT_TEXT_EN_ID);
    return {
      fr: frEditor ? frEditor.getContent() : null,
      en: enEditor ? enEditor.getContent() : null
    };
  }

  /**
   * Wait (bounded) for the output-text editors to init; return early if none appear.
   * @returns {Promise<void>} resolves once the editors are ready (or absent).
   */
  async function waitOutputTextReady() {
    const tinymce = PAGE_WINDOW.tinymce;
    if (!tinymce) return;

    const editorPresent = () => tinymce.get(OUTPUT_TEXT_FR_ID) || tinymce.get(OUTPUT_TEXT_EN_ID);
    if (!await poll(editorPresent)) return;

    await poll(() => {
      const frEditor = tinymce.get(OUTPUT_TEXT_FR_ID);
      const enEditor = tinymce.get(OUTPUT_TEXT_EN_ID);
      return (!frEditor || frEditor.initialized) && (!enEditor || enEditor.initialized) && !!editorPresent();
    });
  }

  /**
   * Scrape the open edit panel into a FormResult (minus heading meta).
   * @returns {Promise<Object>} the scraped element result.
   */
  async function scrapePanel() {
    const alias = (document.getElementById('adminFormElementAliasInputText')?.value ?? null) || '';
    let fr = document.getElementById('formElementTermFrenchTermInputText')?.value ?? null;
    let en = document.getElementById('formElementTermEnglishTermInputText')?.value ?? null;
    const hasTerm = fr !== null || en !== null; // term fields present => a real (non-text) element

    if (fr == null && en == null) { // no term fields => OUTPUT_TEXT element
      await waitOutputTextReady();
      const outputText = scrapeOutputText();
      fr = outputText.fr;
      en = outputText.en;
    }

    return {
      alias: alias,
      isSection: false,
      orphan: !alias && hasTerm,
      fr: fr == null ? '' : fr,
      en: en == null ? '' : en,
      choices: scrapeChoices()
    };
  }

  /**
   * Parse a <select> option's value as JSON, or null if it isn't a JSON object.
   * @param {string} optionValue  the option's value string.
   * @returns {Object|null} the parsed object, or null if not JSON.
   */
  function parseDto(optionValue) {
    if (!optionValue || optionValue.charAt(0) !== '{') return null;
    try {
      return JSON.parse(optionValue);
    } catch (err) {
      return null;
    }
  }

  /**
   * Flatten one element DTO into the { alias, fr, en, choices } shape used everywhere downstream.
   * @param {Object} node  the raw element DTO.
   * @returns {{alias: string, fr: string, en: string, choices: {fr: string, en: string}[]}} normalized result.
   */
  function dtoToResult(node) {
    const term = node.termDto || {};
    const choices = Array.isArray(node.choiceDtoList)
      ? node.choiceDtoList.map(choice => {
          const choiceTerm = choice.termDto || {};
          return { fr: choiceTerm.frenchTerm || '', en: choiceTerm.englishTerm || '' };
        })
      : [];
    // ?? uses the next field only when the previous one is null or undefined.
    return {
      alias: node.alias || '',
      fr: term.frenchTerm ?? node.frenchText ?? '',
      en: term.englishTerm ?? node.englishText ?? '',
      choices: choices
    };
  }

  /**
   * Index `entry` under BOTH its flattened FR and EN names (first writer wins), so a DOM
   * preview matches no matter which language the UI locale renders. Shared by section-name
   * and output-text indexing — keep the dedup/normalization rule in one place.
   * @param {Map<string, {fr: string, en: string}>} map  normalized name -> entry; mutated.
   * @param {*} frRaw  the FR side to normalize into a key.
   * @param {*} enRaw  the EN side to normalize into a key.
   * @param {{fr: string, en: string}} entry  the value to store under each key.
   * @returns {void}
   */
  function indexByBothLocales(map, frRaw, enRaw, entry) {
    [flatten(frRaw), flatten(enRaw)].forEach(key => {
      if (key && !map.has(key)) map.set(key, entry);
    });
  }

  /**
   * Index a section DTO's authoritative FR+EN names under BOTH normalized names.
   * The DOM only renders one name per the UI locale (frenchName in FR, englishName
   * in EN), so we key on both to recover the pair no matter which the DOM shows.
   * @param {Object} node  a DTO node; only section nodes carry frenchName/englishName.
   * @param {Map<string, {fr: string, en: string}>} sectionNames  normalized name -> {fr, en}; mutated.
   * @returns {void}
   */
  function indexSection(node, sectionNames) {
    if (node.frenchName == null && node.englishName == null) return; // not a section
    const entry = { fr: (node.frenchName || '').trim(), en: (node.englishName || '').trim() };
    indexByBothLocales(sectionNames, entry.fr, entry.en, entry);
  }

  /**
   * Walk a section DTO tree, indexing every element by alias, nested sections by
   * name, and output-text by normalized FR.
   * @param {Object} section  the section DTO to walk.
   * @param {Map<string, Object>} filled       alias -> dtoToResult(node); mutated in place.
   * @param {Map<string, {fr: string, en: string}>} sectionNames  normalized name -> {fr, en}; mutated.
   * @param {Map<string, {fr: string, en: string}>} outputText  normalized FR -> {fr, en}; mutated in place.
   * @returns {void}
   */
  function collectChildren(section, filled, sectionNames, outputText) {
    const children = Array.isArray(section.formElementDtoList) ? section.formElementDtoList : [];
    children.forEach(node => {
      if (node.alias && !filled.has(node.alias)) filled.set(node.alias, dtoToResult(node));

      indexSection(node, sectionNames); // no-op unless this node is a (possibly nested) section

      // Index output-text by BOTH FR and EN, so an alias-less preview matches any locale.
      if (node.frenchText != null || node.englishText != null) {
        const entry = { fr: node.frenchText || '', en: node.englishText || '' };
        indexByBothLocales(outputText, node.frenchText, node.englishText, entry);
      }

      if (Array.isArray(node.formElementDtoList)) collectChildren(node, filled, sectionNames, outputText);
    });
  }

  /**
   * Same JSON for every edit, so one parse covers the whole form.
   * @param {Map<string, Object>} filled  alias -> result; mutated in place.
   * @param {Map<string, {fr: string, en: string}>} sectionNames  normalized name -> {fr, en}; mutated.
   * @param {Map<string, {fr: string, en: string}>} outputText  normalized FR -> {fr, en}; mutated in place.
   * @returns {boolean} true on success (the section <select> was found).
   */
  function harvest(filled, sectionNames, outputText) {
    const sectionSelect = document.getElementById('adminFormElementSectionSelectOneMenu_input');
    if (!sectionSelect) return false;

    Array.from(sectionSelect.options).forEach(option => {
      const dto = parseDto(option.value);
      if (!dto) return;
      indexSection(dto, sectionNames); // each top-level <select> option IS a section
      collectChildren(dto, filled, sectionNames, outputText);
    });
    return true;
  }

  /**
   * Line number shown beside a .formElementsRow (its own, not a nested child row's).
   * @param {Element|null} rowEl  the .formElementsRow element.
   * @returns {string} the row number text, or '' if none.
   */
  function rowNum(rowEl) {
    const selector = ':scope > .adminFormRowNumberContainer .adminFormRowNumber';
    const numberEl = rowEl && rowEl.querySelector(selector);
    return numberEl ? numberEl.textContent.trim() : '';
  }

  /**
   * 1-based column of a cell: its index among its row's .formElementsColumn siblings. Forms fill
   * columns left-to-right so this matches the DTO column, disambiguating two elements that share a
   * row across columns (e.g. HizentraPatientCoverage col 1 and HizentraInsuranceCompany col 2).
   * @param {Element|null} el  any element inside a form cell.
   * @returns {string} the 1-based column number, or '' if it can't be determined.
   */
  function colNum(el) {
    const cell = el && el.closest('.formElementsColumn');
    const rowEl = cell && cell.parentElement;
    if (!rowEl) return '';
    const cells = Array.from(rowEl.children).filter(child => child.classList.contains('formElementsColumn'));
    const index = cells.indexOf(cell);
    return index >= 0 ? String(index + 1) : '';
  }

  /**
   * Build the work list from the DOM: every element row and section header, in document order.
   * @returns {Object[]} the ordered list of work items.
   */
  function discover() {
    const scope = document.getElementById('adminFormScrollFragment');
    if (!scope) return [];

    const items = [];
    Array.from(scope.querySelectorAll('[data-alias], .formSectionNameContainer')).forEach(element => {
      const anchor = element.closest('a.ui-commandlink');
      if (!anchor || !anchor.id) return;

      const isSection = element.classList.contains('formSectionNameContainer');
      const alias = isSection ? '' : (element.getAttribute('data-alias') || '');
      // Collapse any run of whitespace (spaces, tabs, newlines) to a single space.
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      const section = isSection ? null : element.closest('.formGrid.formSection');

      items.push({
        alias: alias,
        name: isSection ? text : '',
        previewText: (!isSection && !alias) ? text : '', // no alias → match by visible text
        anchorId: anchor.id,
        isSection: isSection,
        inSection: !!section, // true even if the section's own row number is unreadable
        row: rowNum(element.closest('.formElementsRow')),
        col: isSection ? '' : colNum(element),
        sectionRow: section ? rowNum(section.closest('.formElementsRow')) : ''
      });
    });
    return items;
  }

  /**
   * Strips HTML and collapses to 1 plain line.
   * @param {*} value  raw value, possibly HTML.
   * @returns {string} plain text on a single line.
   */
  function flatten(value) {
    value = String(value == null ? '' : value);
    // Only treat as HTML on a recognized tag, so placeholders like "<nom>" and "TA < 90" survive.
    // Match an opening or closing tag from the known HTML tag list (case-insensitive).
    if (/<\/?(?:p|div|span|br|hr|strong|b|em|i|u|s|strike|del|ins|mark|small|abbr|sub|sup|a|ul|ol|li|dl|dt|dd|h[1-6]|table|thead|tbody|tfoot|tr|td|th|caption|col|colgroup|blockquote|pre|code|img|font)\b[^>]*>/i.test(value)) {
      // Space out block boundaries first, else textContent flattens <p>A.</p><p>B</p> to "A.B".
      // Match closing block tags (</p>, </div>, …) or any <br>, so each can become a space.
      value = value.replace(/<\/(p|div|li|tr|dt|dd|h[1-6]|blockquote|td|th)\s*>|<br\s*\/?>/gi, ' ');
      // Parse inertly via DOMParser: no resource loads or handlers, unlike div.innerHTML = value.
      const doc = new DOMParser().parseFromString(value, 'text/html');
      value = doc.body.textContent || '';
    }
    // Collapse any run of whitespace (spaces, tabs, newlines) to a single space.
    return value.replace(/\s+/g, ' ').trim();
  }

  /**
   * Sections become h2 (##) and elements h3 (###).
   * @param {Object} item  a work item from discover().
   * @returns {{level: number, locator: string}} heading level and row locator.
   */
  function getHeadingMeta(item) {
    if (item.isSection) return { level: 2, locator: '' };
    // Sectioned elements are always ###; locator is (section:order[:column]) when rows are known.
    if (item.inSection) {
      if (!item.sectionRow) return { level: 3, locator: '' };
      // Append the column only past column 1, so single-column rows keep the familiar 2-number code
      // and a 3rd segment appears exactly when it disambiguates a second-column element.
      const column = (item.col && item.col !== '1') ? `:${item.col}` : '';
      return { level: 3, locator: `${item.sectionRow}:${item.row}${column}` };
    }
    // A genuine top-level alias (e.g. ConsultRequestLanguage) stays ## like a section.
    return { level: 2, locator: '' };
  }

  /**
   * Heading: alias or bracket tag; space before (locator) avoids a Markdown link.
   * @param {Object} row  a result row with heading meta.
   * @returns {string} the Markdown heading line.
   */
  function heading(row) {
    const label = row.isSection
      ? '[SECTION]'
      : (row.alias || (row.orphan ? '[WARNING-ALIAS-MISSING]' : '[TEXT]'));
    const prefix = row.level === 3 ? '###' : '##';
    return `${prefix} ${label}${row.locator ? ` (${row.locator})` : ''}`;
  }

  /**
   * Render the collected results as the Markdown that lands on the clipboard.
   * @param {Object[]} rows  the collected result rows.
   * @returns {string} the full Markdown document.
   */
  function toMarkdown(rows) {
    return rows.map(row => {
      const lines = [heading(row), `- **FR :** ${flatten(row.fr)}`, `- **EN :** ${flatten(row.en)}`];
      const choiceLines = (row.choices || [])
        .map(choice => ({ fr: flatten(choice.fr), en: flatten(choice.en) }))
        .filter(choice => choice.fr || choice.en); // a choice blank on both sides carries nothing
      if (choiceLines.length) {
        lines.push('- **Choix de réponse :**');
        choiceLines.forEach(choice => lines.push(`  - ${choice.fr} / ${choice.en}`));
      }
      return lines.join('\n');
    }).join('\n\n');
  }

  /**
   * Full-screen busy overlay with a status box; returns handles to update/remove it.
   * @returns {{remove: () => void, set: (text: string) => void}} overlay control handles.
   */
  function showOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'tm-extract-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: OVERLAY_Z_INDEX,
      background: 'rgba(255,255,255,0.45)',
      cursor: 'progress'
    });

    const statusBox = document.createElement('div');
    Object.assign(statusBox.style, {
      position: 'absolute',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '6px 14px',
      background: '#333',
      color: '#fff',
      borderRadius: '4px',
      font: '13px sans-serif',
      whiteSpace: 'nowrap'
    });

    overlay.appendChild(statusBox);
    document.body.appendChild(overlay);
    return {
      remove: () => overlay.remove(),
      set: text => { statusBox.textContent = text; }
    };
  }

  /**
   * Build one result row over the full default shape, so every row carries the same
   * fields (notably `orphan`) no matter which branch produced it — heading() can then
   * read row.orphan without a branch leaving it undefined.
   * @param {Object} fields       the branch-specific fields (override defaults).
   * @param {Object} headingMeta  { level, locator } from getHeadingMeta (overrides fields).
   * @returns {Object} the merged result row.
   */
  function makeResult(fields, headingMeta) {
    return Object.assign(
      { alias: '', isSection: false, orphan: false, fr: '', en: '', choices: [] },
      fields,
      headingMeta
    );
  }

  /**
   * True for a blank OUTPUT_TEXT spacer (e.g. <p>&nbsp;</p>): alias-less, not a section
   * or orphan, no choices, and empty on both FR and EN. Such rows are layout, not content,
   * so they're dropped from the export rather than surfacing downstream as a phantom
   * "empty element / missing translation" (a one-sided block, with text on one side, is kept).
   * @param {Object} item    the work item from discover().
   * @param {Object} result  the scraped or cached result row.
   * @returns {boolean} whether the row is an empty spacer to drop.
   */
  function isBlankSpacer(item, result) {
    return !item.alias && !item.isSection && !result.orphan
      && !(result.choices && result.choices.length)
      && !flatten(result.fr) && !flatten(result.en);
  }

  /**
   * Walk the whole form, scrape every element, and copy the result as Markdown.
   * @param {HTMLButtonElement} btn  the copy button to flash on success.
   * @returns {Promise<void>} resolves when extraction and copy are done.
   */
  async function runExtraction(btn) {
    const items = discover();
    if (!items.length) return;

    const overlay = showOverlay();
    const filled = new Map();
    const sectionNames = new Map();
    const outputText = new Map();
    const results = [];
    let harvested = false;

    try {
      for (const [index, item] of items.entries()) {
        const headingMeta = getHeadingMeta(item);
        overlay.set(`Extraction en cours ${index + 1} / ${items.length}…`);

        if (item.isSection) {
          results.push(makeResult({ isSection: true, fr: item.name || '' }, headingMeta));
          continue;
        }
        if (item.alias && filled.has(item.alias)) {
          results.push(makeResult(filled.get(item.alias), headingMeta));
          continue;
        }

        // Alias-less text already harvested? Match by preview, skip the openPanel.
        const previewKey = (!item.alias && item.previewText) ? flatten(item.previewText) : '';
        if (previewKey && outputText.has(previewKey)) {
          const cached = outputText.get(previewKey);
          const result = makeResult({ fr: cached.fr, en: cached.en }, headingMeta);
          if (!isBlankSpacer(item, result)) results.push(result);
          continue;
        }

        if (await openPanel(item.anchorId, item.alias)) {
          const result = makeResult(await scrapePanel(), headingMeta);
          if (!isBlankSpacer(item, result)) results.push(result);
          if (!harvested) harvested = harvest(filled, sectionNames, outputText);
        } else if (item.alias) {
          results.push(makeResult({ alias: item.alias }, headingMeta)); // keep a placeholder
        }
        // else: a blank/unreadable alias-less spacer that won't load — drop it.
      }

      overlay.set('Restauration…');
      await restore();

      results.forEach(result => { // set section FR+EN from the DTO (DOM name is locale-dependent)
        if (!result.isSection || !result.fr) return;
        const entry = sectionNames.get(flatten(result.fr));
        if (entry) { result.fr = entry.fr; result.en = entry.en; }
      });

      const markdown = toMarkdown(results);
      if (markdown && copyText(markdown)) flashSuccess(btn);
    } finally {
      overlay.remove();
    }
  }

  /**
   * Build the toolbar copy button, wired to run the extraction on click.
   * @returns {HTMLButtonElement} the ready-to-insert button.
   */
  function makeButton() {
    const btn = document.createElement('button');
    btn.id = COPY_BUTTON_ID;
    btn.type = 'button';
    btn.title = "Extraire l'outil";
    btn.className = 'ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only adminFormButton';
    btn.style.marginRight = '8px';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'ui-button-icon-left ui-icon ui-c';
    iconSpan.appendChild(makeIcon());

    const textSpan = document.createElement('span');
    textSpan.className = 'ui-button-text ui-c';
    textSpan.innerHTML = '&nbsp;'; // icon-only button: span stays present but unlabeled

    btn.appendChild(iconSpan);
    btn.appendChild(textSpan);

    btn.addEventListener('mouseenter', () => btn.classList.add('ui-state-hover'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('ui-state-hover'));
    btn.addEventListener('mousedown', () => btn.classList.add('ui-state-active'));
    btn.addEventListener('mouseup', () => btn.classList.remove('ui-state-active'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('ui-state-active'));
    btn.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      if (extractionInProgress) return;

      extractionInProgress = true;
      btn.classList.add('ui-state-disabled');

      try {
        await runExtraction(btn);
      } catch (err) {
        console.error("Échec de l'extraction :", err);
      } finally {
        extractionInProgress = false;
        const liveButton = document.getElementById(COPY_BUTTON_ID);
        if (liveButton) liveButton.classList.remove('ui-state-disabled');
      }
    });

    if (extractionInProgress) btn.classList.add('ui-state-disabled');
    return btn;
  }

  /**
   * Keep the button present when inside a clinical form (add it, or remove it off-page).
   * @returns {void} nothing; mutates the DOM as a side effect.
   */
  function syncButton() {
    const existingBtn = document.getElementById(COPY_BUTTON_ID);
    const anchor = document.getElementById(TOOLBAR_ANCHOR_ID);

    if (window.location.pathname !== ADMIN_DASHBOARD_PATH || !anchor) {
      if (existingBtn) existingBtn.remove();
      return;
    }
    if (existingBtn) return;

    const btn = makeButton();
    anchor.parentNode.insertBefore(btn, anchor);
  }

  // SPA re-renders can drop our button; re-sync on DOM changes, debounced to one check per frame.
  let syncPending = false;
  const domObserver = new MutationObserver(() => {
    if (syncPending) return;
    syncPending = true;
    requestAnimationFrame(() => {
      syncPending = false;
      syncButton();
    });
  });

  syncButton();
  domObserver.observe(document.body, { childList: true, subtree: true });
})();
