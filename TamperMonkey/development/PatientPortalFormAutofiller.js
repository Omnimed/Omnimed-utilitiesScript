// ==UserScript==
// @name         Omnimed - Autofill formulaire rendez-vous
// @namespace    http://omnimed.com/
// @version      2.0
// @description  Remplit automatiquement le formulaire de prise de rendez-vous Omnimed
// @match        https://itgrpatient.omnimed.com/portal/omnimed/appointment-request/form*
// @match        https://itgrpatient.omnimed.com/portal/omnimed/appointment-booking/form*
// @match        https://itgrpatient.omnimed.com/portal/omnimed/appointment/form*
// @match        https://stagepatient.omnimed.com/portal/omni/appointment/form*
// @match        https://stagepatient.omnimed.com/portal/omni/appointment-request/form*
// @match        https://stagepatient.omnimed.com/portal/omni/appointment-booking/form*
// @match        https://preprodpatient.omnimed.com/portal/omnimed/appointment-request/form*
// @match        https://preprodpatient.omnimed.com/portal/omnimed/appointment-booking/form*
// @match        https://preprodpatient.omnimed.com/portal/omnimed/appointment/form*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ── Patients par environnement ─────────────────────────────────────────────

    const PATIENTS = {
        // itgr + preprod
        default: [
            {
                firstName:         'Ivo',
                lastName:          'Andric',
                birthday:          '1978/10/23',
                gender:            'Homme',
                medicalCareNumber: 'ANDI78102311',
                cellphone:         '1111111111',
                email:             '',
            },
            {
               firstName:         'Bob',
               lastName:          'Burger',
               birthday:          '2024/08/16',
               gender:            'Homme',
               medicalCareNumber: 'BURB24081603',
               cellphone:         '1111111111',
               email:             '',
            }
        ],

        // stage
        stage: [
            {
                firstName:         'Allana',
                lastName:          'Solo',
                birthday:          '1937/07/20',
                gender:            'Femme',
                medicalCareNumber: 'SOLA37572014',
                cellphone:         '1111111111',
                email:             '',
            },
            {
                firstName:         'Bail',
                lastName:          'Antilles',
                birthday:          '1925/05/30',
                gender:            'Homme',
                medicalCareNumber: 'ANTB25053010',
                cellphone:         '1111111111',
                email:             '',
            },
            {
                firstName:         'Joruus',
                lastName:          'Cbaoth',
                birthday:          '1919/07/22',
                gender:            'Homme',
                medicalCareNumber: 'CBAJ19072219',
                cellphone:         '1111111111',
                email:             '',
            },
            {
                firstName:         'Fleur',
                lastName:          'Delacour',
                birthday:          '1937/07/20',
                gender:            'Femme',
                medicalCareNumber: 'DELF37072011',
                cellphone:         '1111111111',
                email:             '',
            }
        ],
    };

    // ── Sélection de la liste selon l'environnement ────────────────────────────
    const isStage = location.hostname.includes('stagepatient');
    const patientList = isStage ? PATIENTS.stage : PATIENTS.default;

    // ── Helpers ────────────────────────────────────────────────────────────────

    function setNgInputValue(el, value) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur',   { bubbles: true }));
    }

    function waitFor(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const obs = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) { obs.disconnect(); resolve(found); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
        });
    }

    async function selectMatOption(triggerEl, optionText) {
        triggerEl.click();
        await new Promise(r => setTimeout(r, 400));
        const options = document.querySelectorAll('mat-option');
        for (const opt of options) {
            if (opt.textContent.trim() === optionText) { opt.click(); break; }
        }
        await new Promise(r => setTimeout(r, 200));
    }

    // ── Remplissage du formulaire ──────────────────────────────────────────────

    async function fillForm(data) {
        try {
            const firstName = await waitFor('#patientFirstName');
            setNgInputValue(firstName, data.firstName);

            const lastName = await waitFor('#patientLastName');
            setNgInputValue(lastName, data.lastName);

            const birthday = await waitFor('#patientBirthday');
            setNgInputValue(birthday, data.birthday);

            const genreSelect = await waitFor('#mat-select-0 .mat-mdc-select-trigger');
            await selectMatOption(genreSelect, data.gender);

            if (data.medicalCareNumber) {
                const hin = await waitFor('#patientMedicalCareNumber');
                setNgInputValue(hin, data.medicalCareNumber);
            }

            if (data.cellphone) {
                const cell = await waitFor('#contactInformationCellphone');
                setNgInputValue(cell, data.cellphone);
            }

            if (data.email) {
                const email = await waitFor('#contactInformationEmail');
                setNgInputValue(email, data.email);
            }

            // Cocher la case de consentement si elle n'est pas déjà cochée
            const checkbox = await waitFor('#mat-mdc-checkbox-0-input');
            if (!checkbox.checked) {
                checkbox.click();
                await new Promise(r => setTimeout(r, 200));
            }

            // Cliquer sur "Sauvegarder et continuer"
            const saveBtn = [...document.querySelectorAll('button')]
                .find(b => b.textContent.trim().includes('Sauvegarder et continuer'));
            if (saveBtn) {
                await new Promise(r => setTimeout(r, 300));
                saveBtn.click();
            } else {
                console.warn('[Omnimed Autofill] Bouton "Sauvegarder et continuer" introuvable.');
            }

            console.log(`[Omnimed Autofill] ${data.firstName} ${data.lastName} rempli ✓`);
        } catch (e) {
            console.error('[Omnimed Autofill] Erreur:', e);
        }
    }

    // ── UI : bouton + popup ────────────────────────────────────────────────────

    const COLORS = {
        primary:   '#474F96',
        hover:     '#383E81',
        itemHover: '#EFF2FF',
        text:      '#232428',
        sub:       '#6B6F8A',
        border:    '#E0E0E0',
    };

    function buildPopup() {
        const popup = document.createElement('div');
        Object.assign(popup.style, {
            position:     'fixed',
            bottom:       '64px',
            right:        '20px',
            zIndex:       '99999',
            background:   '#fff',
            borderRadius: '12px',
            boxShadow:    '0 8px 24px rgba(0,0,0,0.18)',
            minWidth:     '220px',
            overflow:     'hidden',
            fontFamily:   'Poppins, sans-serif',
            display:      'none',
        });

        // En-tête
        const header = document.createElement('div');
        Object.assign(header.style, {
            background:  COLORS.primary,
            color:       '#fff',
            padding:     '10px 14px',
            fontSize:    '12px',
            fontWeight:  '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
        });
        header.textContent = 'Choisir un patient';
        popup.appendChild(header);

        // Liste
        const list = document.createElement('div');
        patientList.forEach((p, i) => {
            const item = document.createElement('div');
            Object.assign(item.style, {
                padding:    '10px 14px',
                cursor:     'pointer',
                borderTop:  i === 0 ? 'none' : `1px solid ${COLORS.border}`,
                transition: 'background 0.15s',
            });

            const name = document.createElement('div');
            Object.assign(name.style, { fontSize: '14px', fontWeight: '600', color: COLORS.text });
            name.textContent = `${p.firstName} ${p.lastName}`;

            const sub = document.createElement('div');
            Object.assign(sub.style, { fontSize: '11px', color: COLORS.sub, marginTop: '2px' });
            sub.textContent = `${p.birthday}  ·  ${p.gender}`;

            item.appendChild(name);
            item.appendChild(sub);

            item.addEventListener('mouseenter', () => item.style.background = COLORS.itemHover);
            item.addEventListener('mouseleave', () => item.style.background = '#fff');
            item.addEventListener('click', () => {
                popup.style.display = 'none';
                fillForm(p);
            });

            list.appendChild(item);
        });
        popup.appendChild(list);

        return popup;
    }

    function injectUI() {
        const popup = buildPopup();
        document.body.appendChild(popup);

        const btn = document.createElement('button');
        btn.textContent = '⚡ Autofill';
        Object.assign(btn.style, {
            position:     'fixed',
            bottom:       '20px',
            right:        '20px',
            zIndex:       '99999',
            padding:      '10px 18px',
            background:   COLORS.primary,
            color:        '#fff',
            border:       'none',
            borderRadius: '24px',
            fontSize:     '14px',
            fontWeight:   '600',
            cursor:       'pointer',
            boxShadow:    '0 4px 12px rgba(0,0,0,0.25)',
            fontFamily:   'Poppins, sans-serif',
            transition:   'background 0.2s',
        });
        btn.addEventListener('mouseenter', () => btn.style.background = COLORS.hover);
        btn.addEventListener('mouseleave', () => btn.style.background = COLORS.primary);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Si un seul patient, remplir directement sans popup
            if (patientList.length === 1) {
                fillForm(patientList[0]);
                return;
            }
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });

        // Fermer la popup si on clique ailleurs
        document.addEventListener('click', () => { popup.style.display = 'none'; });
        popup.addEventListener('click', e => e.stopPropagation());

        document.body.appendChild(btn);
    }

    // ── Init ───────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectUI);
    } else {
        injectUI();
    }

})();
