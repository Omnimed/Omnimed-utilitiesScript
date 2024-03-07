// ==UserScript==
// @name         Jenkins create feature branch
// @namespace    http://tampermonkey.net/
// @version      1.2
// @author       mplante
// @match        https://jenkins.omnimed.com/job/CreateFeatureBranch/build?delay=0sec
// @match        https://jenkins.omnimed.com/*/job/CreateFeatureBranch/build?delay=0sec
// @icon         https://www.google.com/s2/favicons?sz=64&domain=omnimed.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var currentLength = 0
    var branchNameInput = document.getElementsByName('value')[0];
    var div = document.createElement('div');
    var maxLength = 37;

    branchNameInput.addEventListener("input", updateLength);

    div.innerHTML = "<div id='branchNameLength'></div>";
    document.getElementsByName('parameter')[0].appendChild(div);

    function updateLength(e) {
        currentLength = e.target.value.length;
        document.getElementById("branchNameLength").innerHTML = currentLength + "/" + maxLength;
    };

    document.getElementById("branchNameLength").innerHTML = branchNameInput.value.length + "/" + maxLength;

})();
