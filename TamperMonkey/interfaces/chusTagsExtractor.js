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
            findTagsByRegex(/G-.*\^CIUSSSE-CHUS(?:.*\^MED-ECHO)?/g);
        }, 30000);
    }

    function findTagsByRegex(regex) {
        const bodyText = document.body.innerText;
        const matches = bodyText.match(regex);
        const uniqueMatches = {};

        if (matches && matches.length > 0) {
            matches.forEach(match => {
                uniqueMatches[match] = true; // Remove duplicates
            });
            var output = "";
            Object.keys(uniqueMatches).forEach(match => {
                output += match + "\n";
            });
            console.log("Matches found for " + regex);
            console.log(output);
        } else {
            console.log("No matches found for " + regex);
        }
    }

    // Run the function when the page has loaded
    window.addEventListener('load', scanPageForRegex);
})();
