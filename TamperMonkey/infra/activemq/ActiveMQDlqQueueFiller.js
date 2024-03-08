// ==UserScript==
// @name         ActiveMQDlqQueueFiller
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Print all file names from DLQ
// @author       Antoine Cloutier
// @match        http://192.168.254.181:8161/admin/message.jsp*
// @match        http://192.168.254.3:8161/admin/message.jsp*
// @match        http://192.168.254.2:8161/admin/message.jsp*
// @grant        none
// @require https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    setInterval(autofill, 100);
})();

function autofill() {
    if (!queueHasValue()) {
        var originalQueue;
        var url = window.location.href;

        function getUrlParam(name) {
            var params = new URLSearchParams(url.split('?')[1]);
            return params.get(name);
        }

        var jmsDestinationValue = getUrlParam('JMSDestination');

        if (jmsDestinationValue.indexOf('-retry') > -1) {
            jmsDestinationValue = jmsDestinationValue.replace('-retry', '');
        }

        if (jmsDestinationValue.indexOf('.retry') > -1) {
            jmsDestinationValue = jmsDestinationValue.replace('.retry', '');
        }

        if (jmsDestinationValue.indexOf('.dlq') > -1) {
            originalQueue = jmsDestinationValue.substring(0, jmsDestinationValue.indexOf('.dlq'));
        }


        if ($('#queue option[value="' + originalQueue + '"]').length > 0) {
            $("#queue").val(originalQueue);
        }
    }
}

function queueHasValue() {
    return $("#queue").val();
}
