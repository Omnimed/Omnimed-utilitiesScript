// ==UserScript==
// @name         Website Keep-Alive
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Prevents automatic logout by refreshing the keepAlive cookie
// @author       nvroy
// @match        https://cloud.dev.omnimed.com/omnimed/do*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=omnimed.com
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds
    const DEBUG_MODE = false;

    // Debug logging function
    function logDebug(message) {
        if (DEBUG_MODE) {
            console.log(`[Keep-Alive Script] ${message}`);
        }
    }

    // Function to set the needKeepAliveCas in localStorage
    function setKeepAliveItem() {
        localStorage.setItem('needKeepAliveCas', 'false');
        logDebug('Keep-alive item set in localStorage');
    }

    // Function to reset the timeoutCas countdown in localStorage
    function resetTimeoutItem() {
        // Check if the timeoutCas item exists in localStorage
        if (localStorage.getItem('timeoutCas') !== null) {
            // Reset the timeoutCas value to 120 seconds
            localStorage.setItem('timeoutCas', '120000');
            logDebug('Timeout item reset to 120 in localStorage');
        } else {
            logDebug('No timeout item found in localStorage');
        }
    }

    // Function that runs both methods to keep the session alive
    function keepSessionAlive() {
        setKeepAliveItem();
        resetTimeoutItem();
    }

    // Run the keep-alive function when the page loads
    logDebug('Keep-alive script initialized');
    keepSessionAlive();

    // Set up interval to periodically run the keep-alive function
    setInterval(keepSessionAlive, KEEP_ALIVE_INTERVAL);

    // Optional: Monitor for visibility changes to ensure it works even if the tab is inactive
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            logDebug('Page became visible, running keep-alive immediately');
            keepSessionAlive();
        }
    });

    // Optional: Monitor for storage changes to detect if another script updates the values
    window.addEventListener('storage', function(event) {
        if (event.key === 'timeoutCas' || event.key === 'needKeepAliveCas') {
            logDebug(`Storage event detected: ${event.key} changed from ${event.oldValue} to ${event.newValue}`);
            // If timeoutCas is getting low, reset it immediately
            if (event.key === 'timeoutCas' && event.newValue < 30) {
                resetTimeoutItem();
            }
        }
    });
})();
