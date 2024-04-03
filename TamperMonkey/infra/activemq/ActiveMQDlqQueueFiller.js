// ==UserScript==
// @name         ActiveMQDlqQueueFiller
// @namespace    http://tampermonkey.net/
// @version      0.3
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
        let manualMappings = getManualMappings();
        var originalQueue;

        var jmsDestinationValue = getUrlParam('JMSDestination');

        // Keep a copy of the original queue name
        var jmsDestinationValueCopy = jmsDestinationValue;

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
        } else {
            // Use manual mapping as last resort
            originalQueue = manualMappings.get(jmsDestinationValueCopy);
            $("#queue").val(originalQueue);
        }
    }
}

function getManualMappings() {
    let map = new Map();
    map.set('emr.integration-clinical-note-push-fhir-gaspesie.request.note.import-retry.0.dlq', 'Consumer.emr-integration-clinical-note-push-fhir-gaspesie-request-note-push-0.VirtualTopic.push.CLINICAL_NOTE');

    return map;
}

function getUrlParam(name) {
    var params = new URLSearchParams(window.location.href.split('?')[1]);
    return params.get(name);
}

function queueHasValue() {
    return $("#queue").val();
}
