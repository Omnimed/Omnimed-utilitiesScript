// ==UserScript==
// @name         Kibana - CHUS tags extractor
// @namespace    http://tampermonkey.net/
// @version      2024-03-15
// @author       You
// @match        https://kibana.omnimed.com/app/discover*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to scan the page
    function scanPageForRegex() {
        setTimeout(function() {
            const regexPattern = /G-.*\^CIUSSSE-CHUS/g;
            const bodyText = document.body.innerText;
            const matches = bodyText.match(regexPattern);
            const uniqueMatches = {};

            if (matches && matches.length > 0) {
                matches.forEach(match => {
                    uniqueMatches[match] = true; // Remove duplicates
                });
                var output = "";
                Object.keys(uniqueMatches).forEach(match => {
                    output += match + "\n";
                });
                console.log(output);
            } else {
                console.log("No matches found.");
            }
        }, 30000);

    }

    // Run the function when the page has loaded
    window.addEventListener('load', scanPageForRegex);
})();
