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

    const targetBranchMap = new Map([
        ["feature", "develop"],
        ["fd", "develop"],
        ["fr", "rc"],
        ["fm", "master"]
    ]);

    const teamNameMap = new Map([
        ["ai", "brainiacs"],
        ["cp", "chillpills"],
        ["dp", "daftpunks"],
        ["gk", "gatekeepers"],
        ["qa", "qa"],
        ["req", "requesters"],
        ["st", "starshiptroopers"],
        ["tk", "timekeepers"],
        ["tt", "timetwisters"]
     ]);

    const params = new URLSearchParams(window.location.search);
    const branchName = params.get('branchName');

    if (branchName) {
        const branchParts = branchName.split("-");
        const featureName = branchParts.length >= 4 ? branchParts.slice(2).join("-") : "";
        const ticketNumber = branchParts.length >= 4 ? branchParts.at(2) : "";
        const targetBranch = targetBranchMap.has(branchParts.at(0)) ? targetBranchMap.get(branchParts.at(0)) : "develop";
        const teamName = teamNameMap.has(branchParts.at(1)) ? teamNameMap.get(branchParts.at(1)) : "";

        const dropdowns = document.querySelectorAll("select[name='value']");
        const input = document.querySelectorAll("input[name='value']");

        if (dropdowns != 0) {
            dropdowns[0].value = targetBranch;
            dropdowns[1].value = teamName;
        }

        if (input.length != 0) {
            input[0].value = ticketNumber;
            input[1].value = featureName;
            input[1].focus();
        }
    }
})();
