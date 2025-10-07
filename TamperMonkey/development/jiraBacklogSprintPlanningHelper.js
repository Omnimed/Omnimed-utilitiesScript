// ==UserScript==
// @name         Jira backlog sprint planning helper
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Helper to ensure tickets are assigned, evaluated and no one is overloaded [Backlog view]
// @author       acloutier/bpaquet
// @match        https://omnimedjira.atlassian.net/jira/software/c/projects/DEV/boards/*/backlog*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// ==/UserScript==

(function() {
    setInterval(function() {
        refreshJiraBacklog();
        refreshJiraBacklogWorkloadPanel();
    }, 100);

})();

// Option 'Include subtasks in estimates' needs to be off.
function refreshJiraBacklogWorkloadPanel() {
    let $overloadedEl;
    let $panelEl;
    let $unassignedDivEl;

    const WORKLOAD_TRESHOLD = 24;

    $panelEl = jQuery('div[data-testid="modal-dialog--body"]');

    // Flag if any ticket is unassigned
    $unassignedDivEl = $panelEl.find('td').filter(function() {
        return $(this).text() === 'Unassigned';
    });

    if ($unassignedDivEl) {
        setAlert($unassignedDivEl);
    }

    // Flag overloaded members
    $overloadedEl = $panelEl.find('tr:not(:last-child) td:nth-child(4) span').filter(function() {
        const remainingTimeEsimate = $(this).text();
        return remainingTimeEsimate.includes('h') && remainingTimeEsimate.substr(0, remainingTimeEsimate.indexOf('h')) > WORKLOAD_TRESHOLD;
    });

    if ($overloadedEl) {
        setWarning($overloadedEl.parent());
    }

}

// Card Layout (Backlog) needs to have fields 'Σ Remaining Estimate' and 'Σ Time Spent'.
function refreshJiraBacklog() {
    jQuery("div[data-testid='software-context-menu.ui.context-menu.children-wrapper']").each(function() {
        let $firstChildEl;
        let $originalEstimateBadgeEl;
        let remainingTime;
        let $remainingTimeEl;
        const $rowEl = $(this);
        let timeSpent;
        let $timeSpentEl;
        let timeSpentHours;

        const REMAINING_LABEL = 'Remaining: ';
        const REFUSED_REMAINING_TIMES = ['None', '0m', '0h'];
        const REMAINING_ESTIMATE_LABEL = 'Σ Remaining Estimate';
        const TIME_SPENT_LABEL = 'Σ Time Spent';
        const TIME_SPENT_TRESHOLD = 24;
        const SPENT_LABEL = 'Spent: ';

        // Retrieve the remaining time label
        $remainingTimeEl = $(this).find('div[aria-label="' + REMAINING_ESTIMATE_LABEL + '"]');
        remainingTime = $remainingTimeEl.html();

        // Displays 'Remaining:' label
        if (!remainingTime.includes(REMAINING_LABEL)) {
            $remainingTimeEl.html(REMAINING_LABEL + $remainingTimeEl.html());
        }

        // Recomputes the remaining time without the label
        remainingTime = remainingTime.substr(REMAINING_LABEL.length);

        // Override the original estimate badge with the actual remaining time
        $originalEstimateBadgeEl = $(this).find("span[data-testid='issue-field-original-estimate.ui.view.badge'] span");
        $originalEstimateBadgeEl.html(remainingTime);

        // Flags the label and badge in red when valeu is refused
        if (REFUSED_REMAINING_TIMES.includes(remainingTime)) {
            setAlert($originalEstimateBadgeEl.parent());
            setAlert($originalEstimateBadgeEl);
            setAlert($remainingTimeEl);
        }

        // Displays 'Spent:' label
        $timeSpentEl = $remainingTimeEl = $(this).find('div[aria-label="' + TIME_SPENT_LABEL + '"]');
        timeSpent = $timeSpentEl.html();
        if (!timeSpent.includes(SPENT_LABEL)) {
            $timeSpentEl.html(SPENT_LABEL + $timeSpentEl.html());
        }

        // Recomputes the time spent without the label
        timeSpent = timeSpent.substr(SPENT_LABEL.length);

        if (timeSpent.includes('h')) {
            timeSpentHours = timeSpent.substr(0, timeSpent.indexOf('h'));

            // Flags the time spent label when value is over treshold
            if (timeSpentHours >= TIME_SPENT_TRESHOLD) {
                setWarning($timeSpentEl);
            }
        }

        // Change the row's inner div to display flex
        $firstChildEl = $rowEl.find('div').first();
        $firstChildEl.css('display', 'flex');

    });
}

function setAlert($el) {
    $el.css('background-color', '#950606');
    $el.css('color', 'white');
}

function setWarning($el) {
    $el.css('background-color', '#b36200');
    $el.css('color', 'white');
}
