// ==UserScript==
// @name         DLQ Highlighter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Highlights DLQs with > 0 messages
// @author       Antoine Cloutier
// @match        http://192.168.254.181:8161/admin/queues.jsp
// @match        http://192.168.254.3:8161/admin/queues.jsp
// @match        http://192.168.254.2:8161/admin/queues.jsp
// @match        http://192.168.254.182:8161/admin/queues.jsp
// @match        http://192.168.0.71:8161/admin/queues.jsp
// @match        http://192.168.253.10:8161/admin/queues.jsp
// @match        http://192.168.253.48:8161/admin/queues.jsp
// @match        http://localhost:8161/admin/queues.jsp
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
