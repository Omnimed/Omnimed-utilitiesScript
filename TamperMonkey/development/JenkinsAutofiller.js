// ==UserScript==
// @name         Jenkins Autofill Branch Name
// @namespace    http://tampermonkey.net/
// @version      1.1
// @author       msamson
// @description  Fill in branch name from query params
// @match        https://jenkins.omnimed.com/job/CreateFeatureBranch/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jenkins.io
// @updateURL    https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/JenkinsAutofiller.js
// @downloadURL  https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/JenkinsAutofiller.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    const branchName = params.get('branchName');

    if (branchName) {
        const input = document.querySelector("input[name='value']");
        if (input) {
            input.value = branchName;
            input.focus();
        }
    }
})();
