// ==UserScript==
// @name         Jenkins Autofill Branch Name
// @namespace    http://tampermonkey.net/
// @version      1.2
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
        ["dp", "daftpunk"],
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
        const [targetBranch, teamName, ticketNumber, ...rest] = branchName.split("-");
        const featureName = rest.join("-");
        const dropdowns = document.querySelectorAll("select[name='value']");
        const input = document.querySelectorAll("input[name='value']");

        if (dropdowns != 0) {
            dropdowns[0].value = targetBranchMap.get(targetBranch);
            dropdowns[1].value = teamNameMap.get(teamName);
        }

        if (input.length != 0) {
            input[0].value = ticketNumber;
            input[1].value = featureName;
            input[1].focus();
        }
    }
})();
