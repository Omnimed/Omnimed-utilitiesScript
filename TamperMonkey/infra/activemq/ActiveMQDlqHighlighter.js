// ==UserScript==
// @name         DLQ Highlighter
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Highlights DLQs with > 0 messages
// @author       Antoine Cloutier
// @match        http://*/admin/queues.jsp*
// @grant        none
// @require https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    $("#queues").find("tr").each(function(index, tr) {

        var isDlq = false;
        $(tr).find("td:eq(0)").each(function(index, td) {
            var text = $(td).text().toLowerCase();
            if (text.includes('error') || text.includes('dlq') || text.includes('fatal')) {
                isDlq = true;
            }
        });

        $(tr).find("td:eq(1)").each(function(index, td) {
            var count = parseInt($(td).text());
            if (count > 0 && isDlq) {
                $(td).css('background-color', 'red');
            } else if (count > 10) {
                $(td).css('background-color', 'orange');
            } else {
                $(tr).remove();
            }
        });

    });
})();
